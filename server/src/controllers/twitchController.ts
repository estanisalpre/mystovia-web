import { Request, Response } from 'express';
import db from '../config/database.js';

// Twitch response types
interface TwitchTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string[];
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  email?: string;
}

interface TwitchUsersResponse {
  data: TwitchUser[];
}

interface TwitchStream {
  user_id: string;
  user_name: string;
  title: string;
  game_name: string;
  viewer_count: number;
}

interface TwitchStreamsResponse {
  data: TwitchStream[];
}

// Twitch API endpoints
const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_API_URL = 'https://api.twitch.tv/helix';

// Get Twitch OAuth URL - redirects user to Twitch login
export const getTwitchAuthUrl = async (req: Request, res: Response) => {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const redirectUri = process.env.TWITCH_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        success: false,
        error: 'Twitch OAuth not configured'
      });
    }

    const scopes = ['user:read:email'];
    const state = req.cookies.userId || 'anonymous';

    const authUrl = `${TWITCH_AUTH_URL}?` + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state: state
    }).toString();

    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating Twitch auth URL:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Handle Twitch OAuth callback
export const handleTwitchCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error: twitchError } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';

    if (twitchError) {
      return res.redirect(`${frontendUrl}/account-management?twitch_error=access_denied`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/account-management?twitch_error=no_code`);
    }

    const userId = req.cookies.userId || state;
    if (!userId || userId === 'anonymous') {
      return res.redirect(`${frontendUrl}/login?redirect=/account-management&twitch_error=not_logged_in`);
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const redirectUri = process.env.TWITCH_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.redirect(`${frontendUrl}/account-management?twitch_error=not_configured`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch(TWITCH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json() as TwitchTokenResponse;

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Twitch token error:', tokenData);
      return res.redirect(`${frontendUrl}/account-management?twitch_error=token_failed`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user info from Twitch
    const userResponse = await fetch(`${TWITCH_API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Client-Id': clientId
      }
    });

    const userData = await userResponse.json() as TwitchUsersResponse;

    if (!userResponse.ok || !userData.data || !userData.data[0]) {
      console.error('Twitch user fetch error:', userData);
      return res.redirect(`${frontendUrl}/account-management?twitch_error=user_fetch_failed`);
    }

    const twitchUser = userData.data[0];
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Check if this Twitch account is already connected to another user
    const [existingConnection] = await db.query(
      'SELECT account_id FROM user_streaming_accounts WHERE platform = ? AND platform_user_id = ?',
      ['twitch', twitchUser.id]
    ) as any[];

    if (existingConnection.length > 0 && existingConnection[0].account_id !== parseInt(userId)) {
      return res.redirect(`${frontendUrl}/account-management?twitch_error=already_connected`);
    }

    // Insert or update the streaming account
    await db.query(`
      INSERT INTO user_streaming_accounts
        (account_id, platform, platform_user_id, platform_username, platform_display_name,
         platform_profile_image, access_token, refresh_token, token_expires_at)
      VALUES (?, 'twitch', ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        platform_user_id = VALUES(platform_user_id),
        platform_username = VALUES(platform_username),
        platform_display_name = VALUES(platform_display_name),
        platform_profile_image = VALUES(platform_profile_image),
        access_token = VALUES(access_token),
        refresh_token = VALUES(refresh_token),
        token_expires_at = VALUES(token_expires_at),
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      twitchUser.id,
      twitchUser.login,
      twitchUser.display_name,
      twitchUser.profile_image_url,
      access_token,
      refresh_token,
      expiresAt
    ]);

    res.redirect(`${frontendUrl}/account-management?twitch_success=true`);
  } catch (error) {
    console.error('Error handling Twitch callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
    res.redirect(`${frontendUrl}/account-management?twitch_error=internal_error`);
  }
};

// Disconnect Twitch account
export const disconnectTwitch = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Get the access token to revoke it
    const [accounts] = await db.query(
      'SELECT access_token FROM user_streaming_accounts WHERE account_id = ? AND platform = ?',
      [userId, 'twitch']
    ) as any[];

    if (accounts.length > 0 && accounts[0].access_token) {
      // Revoke the token with Twitch
      const clientId = process.env.TWITCH_CLIENT_ID;
      if (clientId) {
        try {
          await fetch('https://id.twitch.tv/oauth2/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              token: accounts[0].access_token
            })
          });
        } catch (revokeError) {
          console.error('Error revoking Twitch token:', revokeError);
        }
      }
    }

    // Delete from database
    await db.query(
      'DELETE FROM user_streaming_accounts WHERE account_id = ? AND platform = ?',
      [userId, 'twitch']
    );

    res.json({ success: true, message: 'Twitch account disconnected' });
  } catch (error) {
    console.error('Error disconnecting Twitch:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get user's connected streaming accounts
export const getMyStreamingAccounts = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const [accounts] = await db.query(`
      SELECT
        id, platform, platform_username, platform_display_name,
        platform_profile_image, is_live, is_verified, created_at
      FROM user_streaming_accounts
      WHERE account_id = ?
    `, [userId]) as any[];

    res.json({ success: true, accounts });
  } catch (error) {
    console.error('Error fetching streaming accounts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all live streams (public endpoint)
export const getLiveStreams = async (req: Request, res: Response) => {
  try {
    const [streams] = await db.query(`
      SELECT
        usa.id,
        usa.platform,
        usa.platform_username,
        usa.platform_display_name,
        usa.platform_profile_image,
        usa.stream_title,
        usa.stream_game,
        usa.viewer_count,
        usa.is_live,
        usa.last_live_check,
        p.name as character_name,
        p.level as character_level,
        p.vocation as character_vocation
      FROM user_streaming_accounts usa
      LEFT JOIN players p ON p.account_id = usa.account_id AND p.deleted = 0
      WHERE usa.is_live = TRUE
      ORDER BY usa.viewer_count DESC
    `) as any[];

    // Group by streamer (one streamer may have multiple characters)
    const streamersMap = new Map();
    for (const stream of streams) {
      if (!streamersMap.has(stream.id)) {
        streamersMap.set(stream.id, {
          ...stream,
          characters: []
        });
      }
      if (stream.character_name) {
        streamersMap.get(stream.id).characters.push({
          name: stream.character_name,
          level: stream.character_level,
          vocation: stream.character_vocation
        });
      }
    }

    const uniqueStreams = Array.from(streamersMap.values()).map(s => ({
      id: s.id,
      platform: s.platform,
      username: s.platform_username,
      displayName: s.platform_display_name,
      profileImage: s.platform_profile_image,
      title: s.stream_title,
      game: s.stream_game,
      viewerCount: s.viewer_count,
      character: s.characters[0] || null // Primary character
    }));

    res.json({ success: true, streams: uniqueStreams });
  } catch (error) {
    console.error('Error fetching live streams:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Internal function to refresh live status (can be called by cron interval)
export const refreshLiveStatusInternal = async (): Promise<{ success: boolean; total?: number; live?: number; error?: string }> => {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Twitch not configured' };
    }

    // Get app access token for API calls
    const tokenResponse = await fetch(TWITCH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    const tokenData = await tokenResponse.json() as TwitchTokenResponse;
    if (!tokenData.access_token) {
      return { success: false, error: 'Failed to get app token' };
    }

    // Get all Twitch accounts
    const [accounts] = await db.query(
      'SELECT id, platform_user_id FROM user_streaming_accounts WHERE platform = ?',
      ['twitch']
    ) as any[];

    if (accounts.length === 0) {
      return { success: true, total: 0, live: 0 };
    }

    // Twitch API allows up to 100 user_ids per request
    const userIds = accounts.map((a: any) => a.platform_user_id).filter(Boolean);

    if (userIds.length === 0) {
      return { success: true, total: 0, live: 0 };
    }

    // Check streams status
    const streamsUrl = new URL(`${TWITCH_API_URL}/streams`);
    userIds.forEach((id: string) => streamsUrl.searchParams.append('user_id', id));

    const streamsResponse = await fetch(streamsUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Client-Id': clientId
      }
    });

    const streamsData = await streamsResponse.json() as TwitchStreamsResponse;
    const liveStreams = new Map();

    if (streamsData.data) {
      for (const stream of streamsData.data) {
        liveStreams.set(stream.user_id, {
          title: stream.title,
          game: stream.game_name,
          viewerCount: stream.viewer_count
        });
      }
    }

    // Update all accounts
    for (const account of accounts) {
      const liveData = liveStreams.get(account.platform_user_id);

      if (liveData) {
        await db.query(`
          UPDATE user_streaming_accounts
          SET is_live = TRUE, stream_title = ?, stream_game = ?, viewer_count = ?, last_live_check = NOW()
          WHERE id = ?
        `, [liveData.title, liveData.game, liveData.viewerCount, account.id]);
      } else {
        await db.query(`
          UPDATE user_streaming_accounts
          SET is_live = FALSE, stream_title = NULL, stream_game = NULL, viewer_count = 0, last_live_check = NOW()
          WHERE id = ?
        `, [account.id]);
      }
    }

    return { success: true, total: accounts.length, live: liveStreams.size };
  } catch (error) {
    console.error('Error refreshing live status:', error);
    return { success: false, error: 'Internal server error' };
  }
};

// Refresh live status for all Twitch accounts (HTTP endpoint)
export const refreshLiveStatus = async (req: Request, res: Response) => {
  const result = await refreshLiveStatusInternal();

  if (result.success) {
    res.json({
      success: true,
      message: 'Live status updated',
      total: result.total,
      live: result.live
    });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
};
