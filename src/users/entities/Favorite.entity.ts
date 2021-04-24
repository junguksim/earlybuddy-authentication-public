import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity()
export class Favorite {
  @PrimaryGeneratedColumn('increment')
  favoriteIdx: number;

  @Column()
  favoriteCategory: number;

  @Column()
  favoriteInfo: string;

  @Column()
  favoriteLongitude: number;

  @Column()
  favoriteLatitude: number;

  @ManyToOne(
    type => User,
    user => user.favorites,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'fk_userIdx' })
  user: User;

  @Column()
  fk_userIdx: number;

  public static of(params: Partial<Favorite>): Favorite {
    const favorite = new Favorite();

    Object.assign(favorite, params);

    return favorite;
  }
}
