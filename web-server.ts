import "reflect-metadata"
import * as express from 'express'
import * as path from 'path'
import { AppDataSource } from "./data-source"
import { User, UserRole, UserStatus } from "./src/entity/User"
import { Listing } from "./src/entity/Listing"
import { Request as ExchangeRequest } from "./src/entity/Request"
import { ListingAction } from "./src/entity/ListingAction"
import { ModerationAction } from "./src/entity/ModerationAction"

const app = express()
const port = 3010

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

AppDataSource.initialize().then(() => {
    console.log("✅ Database connected")

    app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`)
    })
}).catch(error => {
    console.log("❌ Database error:", error)
    process.exit(1)
})

// Головна сторінка
app.get('/', async (req, res) => {
    console.log("📥 Request to /")
    try {
        console.log("🔍 Counting users...")
        const userCount = await AppDataSource.getRepository(User).count()
        console.log(`👥 Users: ${userCount}`)
        
        console.log("🔍 Counting listings...")
        const listingCount = await AppDataSource.getRepository(Listing).count()
        console.log(`📋 Listings: ${listingCount}`)
        
        console.log("🔍 Counting requests...")
        const requestCount = await AppDataSource.getRepository(ExchangeRequest).count()
        console.log(`📬 Requests: ${requestCount}`)
        
        console.log("🎨 Rendering template...")
        res.render('index', { 
            userCount, 
            listingCount, 
            requestCount 
        })
        console.log("✅ Response sent")
    } catch (error) {
        console.error("❌ Error in /:", error)
        res.render('error', { error })
    }
})

// JOIN запити
app.get('/joins', async (req, res) => {
    try {
        // JOIN 1: Користувачі з їх оголошеннями
        const usersWithListings = await AppDataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.listings', 'listing')
            .where('user.role = :role', { role: UserRole.USER })
            .limit(10)
            .getMany()

        // JOIN 2: Оголошення з діями модерації
        const listingsWithActions = await AppDataSource
            .getRepository(Listing)
            .createQueryBuilder('listing')
            .leftJoinAndSelect('listing.user', 'user')
            .leftJoinAndSelect('listing.moderationActions', 'action')
            .leftJoinAndSelect('action.actor', 'actor')
            .limit(10)
            .getMany()

        res.render('joins', { 
            usersWithListings, 
            listingsWithActions 
        })
    } catch (error) {
        res.render('error', { error })
    }
})

// Агрегатні запити
app.get('/aggregates', async (req, res) => {
    try {
        // COUNT: Кількість оголошень по статусах
        const listingsByStatus = await AppDataSource
            .getRepository(Listing)
            .createQueryBuilder('listing')
            .select('listing.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('listing.status')
            .getRawMany()

        // AVG: Середній баланс користувачів
        const avgBalance = await AppDataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .select('AVG(user.balance)', 'avgBalance')
            .getRawOne()

        // SUM: Загальна сума балансів по ролях
        const balanceByRole = await AppDataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .select('user.role', 'role')
            .addSelect('SUM(user.balance)', 'totalBalance')
            .addSelect('COUNT(*)', 'userCount')
            .groupBy('user.role')
            .getRawMany()

        res.render('aggregates', { 
            listingsByStatus, 
            avgBalance, 
            balanceByRole 
        })
    } catch (error) {
        res.render('error', { error })
    }
})

// GROUP BY та HAVING
app.get('/groupby', async (req, res) => {
    try {
        // Користувачі з більш ніж 2 оголошеннями
        const activeUsers = await AppDataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .leftJoin('user.listings', 'listing')
            .select('user.id', 'id')
            .addSelect('user.username', 'username')
            .addSelect('user.firstName', 'firstName')
            .addSelect('user.secondName', 'secondName')
            .addSelect('COUNT(listing.id)', 'listingCount')
            .groupBy('user.id')
            .having('COUNT(listing.id) > :count', { count: 2 })
            .orderBy('COUNT(listing.id)', 'DESC')
            .getRawMany()

        res.render('groupby', { activeUsers })
    } catch (error) {
        res.render('error', { error })
    }
})

// CRUD для користувачів
app.get('/users', async (req, res) => {
    try {
        const users = await AppDataSource
            .getRepository(User)
            .find({
                order: { id: 'ASC' },
                take: 50
            })
        
        res.render('users', { users })
    } catch (error) {
        res.render('error', { error })
    }
})
app.get('/users/new', (req, res) => {
    res.render('user-create')
})
app.get('/users/:id', async (req, res) => {
    try {
        const user = await AppDataSource
            .getRepository(User)
            .findOne({
                where: { id: parseInt(req.params.id) },
                relations: ['listings']
            })
        
        if (!user) {
            return res.status(404).render('error', { error: 'User not found' })
        }
        
        res.render('user-detail', { user })
    } catch (error) {
        res.render('error', { error })
    }
})

app.post('/users/:id/update', async (req, res) => {
    try {
        const userId = parseInt(req.params.id)
        if (isNaN(userId)) {
            return res.render('error', { error: 'Неправильний ID користувача' })
        }
        
        const { firstName, secondName, email, balance } = req.body
        
        // Валідація балансу
        const parsedBalance = parseFloat(balance)
        if (isNaN(parsedBalance)) {
            return res.render('error', { error: 'Неправильне значення балансу' })
        }
        
        await AppDataSource
            .getRepository(User)
            .update(
                { id: userId },
                { 
                    firstName: firstName?.trim(), 
                    secondName: secondName?.trim(), 
                    email: email?.trim(), 
                    balance: parsedBalance 
                }
            )
        
        res.redirect(`/users/${userId}`)
    } catch (error) {
        console.error('Error updating user:', error)
        res.render('error', { error: error.message })
    }
})

app.post('/users/:id/delete', async (req, res) => {
    try {
        const userId = parseInt(req.params.id)
        if (isNaN(userId)) {
            return res.render('error', { error: 'Неправильний ID користувача' })
        }
        
        // Використовуємо транзакцію для безпечного видалення
        await AppDataSource.transaction(async manager => {
            console.log(`🗑️ Видаляємо користувача ${userId} та всі пов'язані дані...`)
            
            // 1. Видаляємо дії з оголошеннями користувача
            await manager.query(`
                DELETE la FROM listing_action la 
                INNER JOIN listing l ON la.listing_id = l.id 
                WHERE l.user_id = ?
            `, [userId])
            console.log('✅ Видалено дії з оголошеннями')
            
            // 2. Видаляємо запити на обмін (як відправник і як отримувач)
            await manager.query(`
                DELETE FROM request 
                WHERE sender_id = ? OR receiver_id = ?
            `, [userId, userId])
            console.log('✅ Видалено запити на обмін')
            
            // 3. Видаляємо дії модерації користувача (як модератор)
            await manager.query(`
                DELETE FROM moderation_action 
                WHERE moderator_id = ?
            `, [userId])
            console.log('✅ Видалено дії модерації (як модератор)')
            
            // 4. Видаляємо дії модерації над користувачем (як ціль)
            await manager.query(`
                DELETE FROM moderation_action 
                WHERE target_user_id = ?
            `, [userId])
            console.log('✅ Видалено дії модерації (як ціль)')
            
            // 5. Видаляємо всі оголошення користувача
            await manager.query(`
                DELETE FROM listing 
                WHERE user_id = ?
            `, [userId])
            console.log('✅ Видалено оголошення')
            
            // 6. Видаляємо самого користувача
            await manager.query(`
                DELETE FROM user 
                WHERE id = ?
            `, [userId])
            console.log('✅ Видалено користувача')
        })
        
        console.log('🎉 Користувача успішно видалено')
        res.redirect('/users')
    } catch (error) {
        console.error('❌ Помилка при видаленні користувача:', error)
        res.render('error', { 
            error: 'Помилка при видаленні користувача: ' + error.message 
        })
    }
})


app.post('/users/create', async (req, res) => {
    try {
        const { username, firstName, secondName, email, password, role, balance } = req.body
        
        // Валідація обов'язкових полів
        if (!username?.trim() || !firstName?.trim() || !secondName?.trim() || !email?.trim() || !password?.trim()) {
            return res.render('user-create', { 
                error: 'Всі обов\'язкові поля мають бути заповнені',
                formData: req.body
            })
        }
        
        // Валідація балансу
        const parsedBalance = balance ? parseFloat(balance) : 0
        if (isNaN(parsedBalance)) {
            return res.render('user-create', { 
                error: 'Неправильне значення балансу',
                formData: req.body
            })
        }
        
        // Перевірка чи користувач вже існує
        const existingUser = await AppDataSource
            .getRepository(User)
            .findOne({
                where: [
                    { username: username.trim() },
                    { email: email.trim() }
                ]
            })
        
        if (existingUser) {
            return res.render('user-create', { 
                error: 'Користувач з таким username або email вже існує',
                formData: req.body
            })
        }
        
        const user = new User()
        user.username = username.trim()
        user.firstName = firstName.trim()
        user.secondName = secondName.trim()
        user.email = email.trim()
        user.password = password.trim()
        user.role = role as UserRole
        user.status = UserStatus.ACTIVE
        user.balance = parsedBalance
        
        const savedUser = await AppDataSource.getRepository(User).save(user)
        
        res.redirect(`/users/${savedUser.id}`)
    } catch (error) {
        console.error('Error creating user:', error)
        res.render('user-create', { 
            error: error.message,
            formData: req.body
        })
    }
})

app.get('/users/:id/edit', async (req, res) => {
    try {
        const user = await AppDataSource
            .getRepository(User)
            .findOne({
                where: { id: parseInt(req.params.id) }
            })
        
        if (!user) {
            return res.status(404).render('error', { error: 'User not found' })
        }
        
        res.render('user-edit', { user })
    } catch (error) {
        res.render('error', { error })
    }
})

app.get('/users/:id/delete-confirm', async (req, res) => {
    try {
        const user = await AppDataSource
            .getRepository(User)
            .findOne({
                where: { id: parseInt(req.params.id) },
                relations: ['listings']
            })
        
        if (!user) {
            return res.status(404).render('error', { error: 'User not found' })
        }
        
        res.render('user-delete-confirm', { user })
    } catch (error) {
        res.render('error', { error })
    }
})

app.get('/test', (req, res) => {
    res.send('Server is working!')
})