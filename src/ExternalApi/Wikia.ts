import axios, {AxiosResponse} from "axios";
import {CommandError} from "../types";

interface WikiaSearchResult {
    quality: number;
    url: string;
    ns: number;
    id: number;
    title: string;
    snippet: string;
}

export class Wikia {
    static async searchFirstLink(query: string): Promise<string> {
        const articles = await this.searchArticles(query);

        if (articles.length === 0) {
            throw new CommandError(`Cannot find article with search query \`${query}\``);
        }

        return articles[0].url;
    }

    private static async searchArticles(query: string): Promise<WikiaSearchResult[]> {
        const url = `https://beastars-eng.fandom.com/api/v1/Search/List?query=${encodeURIComponent(query)}`;

        const result = <AxiosResponse> await axios.get(url).catch(() => {
            //Cannot find article
            throw new CommandError(`Cannot find article with search query \`${query}\``);
        });

        return result.data.items;
    }
}
