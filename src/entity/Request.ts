import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Listing } from "./Listing";

export enum RequestStatus {
    REQUESTED = "Requested",
    ACCEPTED = "accepted",
    DECLINED = "declined",
}

@Entity()
export class Request {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.senderRequests, { nullable: false })
    @JoinColumn({ name: "sender_id" })
    sender: User;

    @ManyToOne(() => User, user => user.receiverRequests, { nullable: false })
    @JoinColumn({ name: "receiver_id" })
    receiver: User;

    @ManyToOne(() => Listing, listing => listing.senderRequests, { nullable: false })
    @JoinColumn({ name: "sender_listing_id" })
    senderListing: Listing;

    @ManyToOne(() => Listing, listing => listing.receiverRequests, { nullable: false })
    @JoinColumn({ name: "receiver_listing_id" })
    receiverListing: Listing;
    
    @Column({ type: "enum", enum: RequestStatus, default: RequestStatus.REQUESTED })
    status: RequestStatus;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;
}