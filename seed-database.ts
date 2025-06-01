import "reflect-metadata"
import { faker } from '@faker-js/faker'
import { AppDataSource } from "./data-source"
import { User, UserRole, UserStatus } from "./src/entity/User"
import { ListingAction, ListingActionType } from "./src/entity/ListingAction"
import { Listing, ListingRole, ListingStatus } from "./src/entity/Listing"
import { ModerationAction, ModerationActionType } from "./src/entity/ModerationAction"
import { RequestStatus, Request } from "./src/entity/Request"

async function seedDatabase() {
    try {
        await AppDataSource.initialize()
        console.log("✅ Connected to database")

        await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0')
        await AppDataSource.query('TRUNCATE TABLE listing_action')
        await AppDataSource.query('TRUNCATE TABLE moderation_action')
        await AppDataSource.query('TRUNCATE TABLE request')
        await AppDataSource.query('TRUNCATE TABLE listing')
        await AppDataSource.query('TRUNCATE TABLE user')
        await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1')
        console.log("🗑️ Cleared existing data")

        const userRepository = AppDataSource.getRepository(User)
        const listingRepository = AppDataSource.getRepository(Listing)
        const listingActionRepository = AppDataSource.getRepository(ListingAction)
        const moderationActionRepository = AppDataSource.getRepository(ModerationAction)
        const requestRepository = AppDataSource.getRepository(Request)

        const users: User[] = []
        const admin = new User()
        admin.username = "admin"
        admin.password = faker.internet.password()
        admin.firstName = "Адмін"
        admin.secondName = "Головний"
        admin.email = "admin@example.com"
        admin.role = UserRole.ADMIN
        admin.status = UserStatus.ACTIVE
        admin.balance = 1000
        users.push(await userRepository.save(admin))
        const moderator = new User()
        moderator.username = "moderator"
        moderator.password = faker.internet.password()
        moderator.firstName = "Модератор"
        moderator.secondName = "Перший"
        moderator.email = "moderator@example.com"
        moderator.role = UserRole.MODERATOR
        moderator.status = UserStatus.ACTIVE
        moderator.balance = 500
        users.push(await userRepository.save(moderator))
        for (let i = 0; i < 20; i++) {
            const user = new User()
            user.username = faker.internet.userName()
            user.password = faker.internet.password()
            user.firstName = faker.person.firstName()
            user.secondName = faker.person.lastName()
            user.email = faker.internet.email()
            user.role = UserRole.USER
            user.status = faker.helpers.enumValue(UserStatus)
            user.balance = faker.number.float({ min: 0, max: 1000, fractionDigits: 2 })
            users.push(await userRepository.save(user))
        }
        console.log(`👥 Created ${users.length} users`)
        const listings: Listing[] = []
        const categories = ['Електроніка', 'Одяг', 'Книги', 'Спорт', 'Дім', 'Автомобілі', 'Музика']
        
        for (let i = 0; i < 50; i++) {
            const listing = new Listing()
            listing.user = faker.helpers.arrayElement(users.filter(u => u.role === UserRole.USER))
            listing.userListingRole = faker.helpers.enumValue(ListingRole)
            listing.header = `${faker.helpers.arrayElement(categories)} - ${faker.commerce.productName()}`
            listing.description = faker.commerce.productDescription()
            listing.status = faker.helpers.enumValue(ListingStatus)
            listing.createdAt = faker.date.recent({ days: 30 })
            
            listings.push(await listingRepository.save(listing))
        }
        console.log(`📋 Created ${listings.length} listings`)
        for (let i = 0; i < 15; i++) {
            const listingAction = new ListingAction()
            listingAction.actor = faker.helpers.arrayElement([admin, moderator])
            listingAction.listing = faker.helpers.arrayElement(listings)
            listingAction.actionType = faker.helpers.enumValue(ListingActionType)
            listingAction.reason = faker.lorem.sentence()
            listingAction.createdAt = faker.date.recent({ days: 10 })
            
            await listingActionRepository.save(listingAction)
        }
        console.log("⚡ Created listing actions")
        for (let i = 0; i < 10; i++) {
            const moderationAction = new ModerationAction()
            moderationAction.moderator = faker.helpers.arrayElement([admin, moderator])
            moderationAction.target_user = faker.helpers.arrayElement(users.filter(u => u.role === UserRole.USER))
            moderationAction.actionType = faker.helpers.enumValue(ModerationActionType)
            moderationAction.reason = faker.lorem.sentence()
            moderationAction.createdAt = faker.date.recent({ days: 20 })
            if (Math.random() > 0.5) {
                moderationAction.expiredAt = faker.date.future({ years: 1 })
            }
            
            await moderationActionRepository.save(moderationAction)
        }
        console.log("🛡️ Created moderation actions")

        // Створити запити на обмін
        for (let i = 0; i < 30; i++) {
            const request = new Request()
            request.sender = faker.helpers.arrayElement(users.filter(u => u.role === UserRole.USER))
            request.receiver = faker.helpers.arrayElement(users.filter(u => u.role === UserRole.USER && u.id !== request.sender.id))
            request.senderListing = faker.helpers.arrayElement(listings.filter(l => l.user.id === request.sender.id))
            request.receiverListing = faker.helpers.arrayElement(listings.filter(l => l.user.id === request.receiver.id))
            request.status = faker.helpers.enumValue(RequestStatus)
            request.createdAt = faker.date.recent({ days: 15 })
            
            await requestRepository.save(request)
        }
        console.log("📬 Created exchange requests")

        console.log("🎉 Database seeded successfully!")
        
    } catch (error) {
        console.error("❌ Error seeding database:", error)
    } finally {
        await AppDataSource.destroy()
    }
}
seedDatabase()