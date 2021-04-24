import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Favorite } from './Favorite.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('increment')
  userIdx: number;

  @Column({
    default: `이비`,
  })
  username: string;

  @Column()
  userId: string;

  @Column()
  password: string;

  @Column()
  scheduleCount: number;

  @Column()
  scheduleSuccess: number;

  @Column()
  scheduleFail: number;

  @Column()
  salt: string;

  @Column()
  deviceToken: string;

  @OneToMany(
    type => Favorite,
    favorite => favorite.user,
    {
      cascade: ['insert', 'update'],
    },
  )
  favorites: Favorite[];

  @Column({
    nullable: true,
  })
  @Exclude()
  public currentHashedRefreshToken?: string;

  @CreateDateColumn()
  createdAt : Date

  @UpdateDateColumn()
  updatedAt : Date

  public static of(params: Partial<User>): User {
    const user = new User();

    Object.assign(user, params);

    return user;
  }
}
