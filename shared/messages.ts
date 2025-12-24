import type {
  RoomConfig,
  PublicRoomState,
  PublicPlayer,
  AllPlayerAnswers,
  VotingResults,
  RoundResults,
  FinalResults
} from './types';

// Messages from client to server
export type ClientMessage =
  | { type: 'join'; playerName: string; deviceId: string }
  | { type: 'ready' }
  | { type: 'not_ready' }
  | { type: 'start_game' }
  | { type: 'submit_answers'; answers: Record<string, string> }
  | { type: 'update_answer'; category: string; answer: string }
  | { type: 'call_basta' }
  | { type: 'vote'; category: string; targetPlayerId: string; valid: boolean }
  | { type: 'voting_ready' }
  | { type: 'host_decide_tie'; category: string; targetPlayerId: string; valid: boolean }
  | { type: 'kick_player'; targetPlayerId: string }
  | { type: 'update_config'; config: Partial<RoomConfig> }
  | { type: 'transfer_host'; targetPlayerId: string }
  | { type: 'ping' };

// Messages from server to client
export type ServerMessage =
  | { type: 'room_state'; state: PublicRoomState }
  | { type: 'player_joined'; player: PublicPlayer }
  | { type: 'player_left'; playerId: string }
  | { type: 'player_reconnected'; playerId: string }
  | { type: 'player_ready'; playerId: string; isReady: boolean }
  | { type: 'countdown_started'; duration: number }
  | { type: 'game_started'; letter: string; categories: string[] }
  | { type: 'round_started'; round: number; letter: string; totalRounds: number }
  | { type: 'basta_called'; playerId: string; playerName: string; graceTime: number }
  | { type: 'round_ended' }
  | { type: 'voting_started'; answers: AllPlayerAnswers; timeLimit: number }
  | { type: 'vote_received'; category: string; targetPlayerId: string; votesCount: number; totalVoters: number }
  | { type: 'player_voting_ready'; playerId: string; readyCount: number; totalPlayers: number }
  | { type: 'voting_ended'; results: VotingResults }
  | { type: 'round_results'; results: RoundResults }
  | { type: 'ready_check_started'; timeLimit: number }
  | { type: 'game_over'; finalResults: FinalResults }
  | { type: 'error'; message: string; code: ErrorCode }
  | { type: 'player_progress'; playerId: string; filledCount: number }
  | { type: 'config_updated'; config: RoomConfig }
  | { type: 'host_changed'; newHostId: string; newHostName: string }
  | { type: 'player_kicked'; playerId: string; playerName: string }
  | { type: 'timer_update'; timerType: 'round' | 'voting' | 'between_rounds'; remaining: number }
  | { type: 'pong' };

// Error codes
export type ErrorCode =
  | 'ROOM_FULL'
  | 'ROOM_NOT_FOUND'
  | 'GAME_IN_PROGRESS'
  | 'NOT_HOST'
  | 'NOT_ENOUGH_PLAYERS'
  | 'INVALID_PHASE'
  | 'INVALID_MESSAGE'
  | 'PLAYER_NOT_FOUND'
  | 'ALREADY_VOTED'
  | 'CANNOT_VOTE_SELF'
  | 'DUPLICATE_NAME'
  | 'NAME_TOO_SHORT'
  | 'NAME_TOO_LONG';

// Error messages (will be translated on client)
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  ROOM_FULL: 'errors.room_full',
  ROOM_NOT_FOUND: 'errors.room_not_found',
  GAME_IN_PROGRESS: 'errors.game_in_progress',
  NOT_HOST: 'errors.not_host',
  NOT_ENOUGH_PLAYERS: 'errors.not_enough_players',
  INVALID_PHASE: 'errors.invalid_phase',
  INVALID_MESSAGE: 'errors.invalid_message',
  PLAYER_NOT_FOUND: 'errors.player_not_found',
  ALREADY_VOTED: 'errors.already_voted',
  CANNOT_VOTE_SELF: 'errors.cannot_vote_self',
  DUPLICATE_NAME: 'errors.duplicate_name',
  NAME_TOO_SHORT: 'errors.name_too_short',
  NAME_TOO_LONG: 'errors.name_too_long'
};
