import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn} from 'typeorm';
import { Listing } from './Listing';
import { User } from './User';

export enum ListingActionType {
    BAN = 'ban',
    UNBAN = 'unban',
    CLOSE = 'close'
}

@Entity()
export class ListingAction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.moderationListingActions)
    @JoinColumn({ name: 'actor_id' })
    actor: User;

    @ManyToOne(() => Listing, listing => listing.moderationActions)
    @JoinColumn({ name: 'listing_id' })
    listing: Listing;

    @Column({ type: 'enum', enum: ListingActionType })
    actionType: ListingActionType;

    @Column({ type: 'text', nullable: true })
    reason?: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}