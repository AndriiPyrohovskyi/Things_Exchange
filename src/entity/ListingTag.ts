import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn} from 'typeorm';
import { Listing } from './Listing';

@Entity()
export class ListingTag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 50 })
    name: string;

    @ManyToOne(() => Listing, listing => listing.tags, { nullable: false })
    @JoinColumn({ name: 'listing_id' })
    listing: Listing;
}