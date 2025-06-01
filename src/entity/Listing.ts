import {Entity, Column, CreateDateColumn, OneToMany, ManyToOne, PrimaryGeneratedColumn, JoinColumn} from 'typeorm';
import { User } from './User';
import { ListingAction } from './ListingAction';
import { Request } from './Request';
import { ListingPhoto } from './ListingPhoto';
import { ListingTag } from './ListingTag';

export enum ListingStatus {
    OPENED = 'opened',
    CLOSED = 'closed',
    BANNED = 'banned',
    INVISIBLE = 'invisible'
}

export enum ListingRole {
    GIVE = 'give',
    GET = 'get'
}

@Entity()
export class Listing {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, user => user.listings)
    @JoinColumn({ name: 'user_id' })
    user: User

    @Column({type: 'enum', enum: ListingRole})
    userListingRole: ListingRole

    @Column({ type: 'varchar', length: 100 })
    header: string

    @Column({ type: 'text' })
    description: string
    
    @CreateDateColumn()
    createdAt: Date

    @Column({type: 'enum', enum: ListingStatus, default: ListingStatus.OPENED})
    status: ListingStatus

    @OneToMany(() => ListingAction, listingAction => listingAction.listing, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    moderationActions: ListingAction[]

    @OneToMany(() => Request, request => request.senderListing, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    senderRequests: Request[]

    @OneToMany(() => Request, request => request.receiverListing, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    receiverRequests: Request[]

    @OneToMany(() => ListingPhoto, listingPhoto => listingPhoto.listing, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    photos: ListingPhoto[]

    @OneToMany(() => ListingTag, listingTag => listingTag.listing, { nullable: true, cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    tags: ListingTag[]
}