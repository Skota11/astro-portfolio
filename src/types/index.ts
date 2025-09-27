// Centralized type exports for the project
// Lanyard API response type definitions
// Reference: https://github.com/Phineas/lanyard
// This file intentionally centralizes all shared types (barrel pattern)

export interface LanyardResponse {
    /** Indicates the API call succeeded */
    success: boolean;
    /** Actual payload */
    data: LanyardData;
}

export interface LanyardData {
    /** Arbitrary key-value data user sets */
    kv: Record<string, string>;
    /** Spotify rich presence (null if not listening) */
    spotify: SpotifyActivity | null;
    /** Discord user profile */
    discord_user: DiscordUser;
    /** All current activities (custom status, games, etc.) */
    activities: Activity[];
    /** High-level Discord presence */
    discord_status: DiscordStatus; // "online" | "idle" | "dnd" | "offline"
    active_on_discord_web: boolean;
    active_on_discord_desktop: boolean;
    active_on_discord_mobile: boolean;
    listening_to_spotify: boolean;
}

export type DiscordStatus = "online" | "idle" | "dnd" | "offline";

export interface DiscordUser {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
    bot: boolean;
    clan: unknown | null;
    global_name: string | null;
    avatar_decoration_data: unknown | null;
    display_name: string | null;
    public_flags: number;
}

export interface ActivityEmoji {
    id: string | null;
    name: string;
    animated?: boolean;
}

export interface Activity {
    /** Snowflake id or "custom" for custom status */
    id: string;
    /** Name of the activity (game name or "Custom Status") */
    name: string;
    /** Discord numeric activity type */
    type: number;
    /** State line (often used in custom status or RP) */
    state?: string;
    /** Detailed line (game details etc.) */
    details?: string;
    /** Emoji object for custom status */
    emoji?: ActivityEmoji;
    /** Epoch ms when created */
    created_at?: number;
    /** App id for rich presence */
    application_id?: string;
    /** Rich presence assets */
    assets?: Record<string, unknown>;
    /** Start / end timestamps */
    timestamps?: {
        start?: number;
        end?: number;
    };
    /** Optional buttons labels */
    buttons?: string[];
}

export interface SpotifyActivity {
    track_id: string;
    timestamps: {
        start: number;
        end: number;
    };
    song: string;
    artist: string;
    album_art_url: string;
    album: string;
}

export function isLanyardResponse(obj: unknown): obj is LanyardResponse {
    return !!obj && typeof obj === 'object' && 'success' in obj && 'data' in obj;
}
