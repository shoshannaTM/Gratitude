import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  type Ref,
} from '@mikro-orm/core';
import { User } from './user.entity';

@Entity()
export class GratitudeEntry {
  @PrimaryKey()
  public id!: number;

  /** The list of gratitude strings the user entered for this day, stored as JSON. */
  @Property({ type: 'json' })
  public entries!: string[];

  /** The calendar date this entry belongs to, stored as "YYYY-MM-DD". */
  @Property()
  public entryDate!: string;

  @Property()
  public createdAt: Date = new Date();

  @ManyToOne({
    entity: () => User,
    deleteRule: 'cascade',
    ref: true,
  })
  public user!: Ref<User>;
}
