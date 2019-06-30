import {BaseEntity, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from "typeorm";
import {Guild, GuildMember, User as DiscordUser} from "discord.js";

@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    discordId: string;

    @ManyToMany(type => User, user => user.legsReceivedFrom, {cascade: true})
    @JoinTable({
        name: "users_legs",
        joinColumn: {
            name: "from",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "to",
            referencedColumnName: "id"
        }
    })
    legsGivenTo: User[];

    @ManyToMany(type => User, user => user.legsGivenTo)
    legsReceivedFrom: User[];

    legsGiven() {
        return this.legsGivenTo.length;
    }

    legsRecieved() {
        return this.legsRecieved.length;
    }

    getDiscordMember(guild: Guild): GuildMember {
        return guild.members.get(this.discordId);
    }

    getDiscordUser(guild: Guild): DiscordUser {
        return this.getDiscordMember(guild).user;
    }

    getStats(guild: Guild): string {

        //Legs given
        const toStr = (() => {

            if (this.legsGivenTo.length === 0) {
                return "has not given any legs";
            }

            const toNames = [];
            for (const to of this.legsGivenTo) {
                toNames.push(to.getDiscordMember(guild).displayName);
            }

            return `has given ${toNames.length} leg${toNames.length === 1 ? "" : "s"} to (${toNames.join(", ")})`;

        })();

        //Legs received
        const fromStr = (() => {

            if (this.legsReceivedFrom.length === 0) {
                return "has not received any legs";
            }

            const fromNames = [];
            for (const from of this.legsReceivedFrom) {
                fromNames.push(from.getDiscordMember(guild).displayName);
            }


            return `has received ${fromNames.length} leg${fromNames.length === 1 ? "" : "s"} from (${fromNames.join(", ")})`;


        })();

        const member = this.getDiscordMember(guild);

        return `${member.displayName} ${toStr} and ${fromStr}`;

    }

    async giveLegTo(receiver: User): Promise<void> {
        this.legsGivenTo.push(receiver);

        await this.save();

        await receiver.reload();

    }

    hasGivenLegTo(receiver: User): boolean {
        return this.legsGivenTo.find(value => value.discordId === receiver.discordId) != undefined;
    }

    static async findOrCreate(discordId: string): Promise<User> {

        let user = await User.findOne({where: {discordId}, relations: ["legsGivenTo", "legsReceivedFrom"]});
        if (user == undefined) {
            user = await User.create({discordId}).save();
            //Load relations
            user = await User.findOne(user.id, {relations: ["legsGivenTo", "legsReceivedFrom"]});
        }

        return user;
    }


}