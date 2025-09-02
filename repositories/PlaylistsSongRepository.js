import { Pool } from "pg";

class PlaylistsSongRepository {
    constructor() {
        this.connection = new Pool;
    }

    /**
     * Get songs by playlist id
     *
     * @param playlistId
     * @returns {Promise<[]>}
     */
    async getByPlaylistId(playlistId) {
        const sqlText = `
        SELECT
            s.id,
            s.title,
            s.performer
        FROM playlists_song AS ps
        INNER JOIN songs AS s ON ps.song_id = s.id
        WHERE ps.playlist_id = $1`;
        const query = {
            text: sqlText,
            values: [playlistId],
        };

        const result = await this.connection.query(query);
        return result.rows;
    }
}

export default PlaylistsSongRepository;