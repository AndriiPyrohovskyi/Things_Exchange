import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from "typeorm";
import { Listing } from "./Listing";
import { ModerationAction } from "./ModerationAction";
import { Request } from "./Request";
import { ListingAction } from "./ListingAction";

export enum UserStatus {
    ACTIVE = "active",
    DO_NOT_DISTURB = "do_not_disturb",
    INACTIVE = "inactive",
    OFFLINE = "offline",
    BANNED = "banned"
}
export enum UserRole {
    USER = "user",
    ADMIN = "admin",
    MODERATOR = "moderator"
}
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 30, unique: true })
    username: string

    @Column({ type: "varchar", length: 100 })
    password: string
    
    @Column({ type: "varchar", length: 30})
    firstName: string

    @Column({ type: "varchar", length: 30 })
    secondName: string

    @Column({ type: "varchar", length: 100, unique: true })
    email: string

    @CreateDateColumn()
    createdAt: Date

    @Column({ type: "varchar", length: 500, nullable: true, default: "https://s3.eu-central-1.amazonaws.com/uploads.mangoweb.org/shared-prod/visegradfund.org/uploads/2021/08/placeholder-male.jpg" })
    avatarUrl: string

    @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
    status: UserStatus

    @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
    role: UserRole
    
    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    balance: number

    @OneToMany(() => Listing, listing => listing.user, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    listings: Listing[]
    
    @OneToMany(() => ModerationAction, moderationAction => moderationAction.moderator, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    moderationActions: ModerationAction[]

    @OneToMany(() => ModerationAction, moderationAction => moderationAction.target_user, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    moderatedActions: ModerationAction[]

    @OneToMany(() => ListingAction, ListingAction => ListingAction.actor, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    moderationListingActions: ListingAction[]

    @OneToMany(() => Request, request => request.sender, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    senderRequests: Request[]

    @OneToMany(() => Request, request => request.receiver, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    receiverRequests: Request[]
}