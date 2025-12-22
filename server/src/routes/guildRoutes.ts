import { Router } from 'express';
import {
  getGuilds,
  getTopGuilds,
  getGuild,
  getGuildLogo,
  uploadGuildLogo,
  deleteGuildLogo,
  createGuild,
  invitePlayer,
  acceptInvite,
  rejectInvite,
  cancelInvite,
  leaveGuild,
  kickMember,
  getPlayerInvites,
  changeMemberRank,
  deleteGuild
} from '../controllers/guildController.js';

const router = Router();

// Public routes
router.get('/', getGuilds);
router.get('/top', getTopGuilds);
router.get('/invites', getPlayerInvites);
router.get('/:id', getGuild);
router.get('/:id/logo', getGuildLogo);

// Protected routes (require login via cookies)
router.post('/', createGuild);
router.post('/:guildId/invite', invitePlayer);
router.post('/:guildId/accept', acceptInvite);
router.post('/:guildId/reject', rejectInvite);
router.post('/:guildId/cancel-invite', cancelInvite);
router.post('/:guildId/leave', leaveGuild);
router.post('/:guildId/kick', kickMember);
router.post('/:guildId/logo', uploadGuildLogo);
router.delete('/:guildId/logo', deleteGuildLogo);
router.post('/:guildId/change-rank', changeMemberRank);
router.delete('/:guildId', deleteGuild);

export default router;
