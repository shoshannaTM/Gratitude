import { Max, Min } from 'class-validator';
import {
  Cascade,
  Collection,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  type Ref,
  Unique,
} from '@mikro-orm/core';
import { File } from './file.entity';
import { GratitudeEntry } from './gratitudeEntry.entity';
import { PasswordReset } from './passwordReset.entity';
import { ShareableId } from './shareableId.entity';
import { UserDevice } from './userDevice.entity';

@Entity()
export class User extends ShareableId {
  @PrimaryKey()
  public id!: number;

  @Property({ nullable: true })
  public firstName?: string;

  @Property({ nullable: true })
  public lastName?: string;

  @Unique()
  @Property({ nullable: true })
  public email?: string;

  @Property()
  public password!: string;

  @OneToOne({
    entity: () => PasswordReset,
    cascade: [Cascade.ALL],
    nullable: true,
    ref: true,
    inversedBy: 'user',
  })
  public passwordReset!: Ref<PasswordReset>;

  @OneToMany(() => UserDevice, (userDevice) => userDevice.user)
  public userDevices = new Collection<UserDevice>(this);

  @OneToMany(() => File, (file) => file.createdBy)
  public fileUploads = new Collection<File>(this);

  @OneToMany(() => GratitudeEntry, (entry) => entry.user)
  public gratitudeEntries = new Collection<GratitudeEntry>(this);

  /** The time of day to send the daily gratitude prompt, stored as "HH:MM" (24-hour). Defaults to 20:00. */
  @Property({ nullable: true })
  public promptTime?: string = '20:00';

  /** How many gratitudes the user wants to enter per day. Minimum of 3. */
  @Min(1)
  @Max(20)
  @Property()
  public promptCount: number = 3;

  /** IANA timezone string, e.g. "America/New_York". Used to fire the daily prompt at the correct local time. */
  @Property({ nullable: true })
  public timezone?: string = 'UTC';
}
