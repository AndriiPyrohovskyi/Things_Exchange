import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn} from 'typeorm';
import {User} from './User';


export enum ModerationActionType {
    BAN = "ban",
    UNBAN = "unban",
    KICK = "kick",
    MUTE = "mute",
    UNMUTE = "unmute",
    WARNING = "warning",
}

@Entity()
export class ModerationAction {
    @PrimaryGeneratedColumn()
    id: number;
    
    @ManyToOne(() => User, user => user.moderatedActions)
    @JoinColumn({ name: 'target_user_id' })
    target_user: User;

    @ManyToOne(() => User, user => user.moderationActions)
    @JoinColumn({ name: 'moderator_id' })
    moderator: User;
    
    @Column({ type: 'enum', enum: ModerationActionType })
    actionType: ModerationActionType;

    @Column({ type: 'text' })
    reason: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    expiredAt: Date;
}