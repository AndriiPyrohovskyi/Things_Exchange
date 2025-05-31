import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn} from 'typeorm';
import { Listing } from './Listing';

@Entity()
export class ListingPhoto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500 })
    photo_url: string;

    @ManyToOne(() => Listing, listing => listing.photos, { nullable: false })
    @JoinColumn({ name: 'listing_id' })
    listing: Listing;
}