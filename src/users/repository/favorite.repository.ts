import { EntityRepository, Repository } from 'typeorm';
import { Favorite } from '../entities/Favorite.entity';

@EntityRepository(Favorite)
export class FavoriteRepository extends Repository<Favorite> {}
