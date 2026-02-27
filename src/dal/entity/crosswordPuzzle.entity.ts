import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  type Ref,
} from '@mikro-orm/core';
import { User } from './user.entity';
import { PlacedWord } from '../../crossword/crossword.types';

@Entity()
export class CrosswordPuzzle {
  @PrimaryKey()
  public id!: number;

  /** "YYYY-MM-DD" of the Monday that starts this puzzle's week. */
  @Property()
  public weekStartDate!: string;

  /** 2D grid of letters — null cells are black squares. */
  @Property({ type: 'json' })
  public grid!: (string | null)[][];

  /** All placed words with their positions, directions, and clues. */
  @Property({ type: 'json' })
  public words!: PlacedWord[];

  /** The keywords used to build this puzzle, extracted from that week's gratitudes. */
  @Property({ type: 'json' })
  public keywords!: string[];

  @Property()
  public createdAt: Date = new Date();

  @ManyToOne({
    entity: () => User,
    deleteRule: 'cascade',
    ref: true,
  })
  public user!: Ref<User>;
}
