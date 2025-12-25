<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { _ } from '$lib/stores/i18n';
  import { gameState } from '$lib/stores/gameState.svelte';
  import { playerState } from '$lib/stores/playerState.svelte';
  import { connection } from '$lib/stores/connection.svelte';
  import { MIN_PLAYERS } from '$shared/constants';

  // Lobby Components
  import ShareLink from '$lib/components/lobby/ShareLink.svelte';
  import PlayerList from '$lib/components/lobby/PlayerList.svelte';
  import RoomConfig from '$lib/components/lobby/RoomConfig.svelte';
  import HostControls from '$lib/components/HostControls.svelte';

  // Game Components
  import LetterDisplay from '$lib/components/game/LetterDisplay.svelte';
  import AnswerForm from '$lib/components/game/AnswerForm.svelte';
  import BastaButton from '$lib/components/game/BastaButton.svelte';
  import PlayerProgress from '$lib/components/game/PlayerProgress.svelte';
  import VotingPhase from '$lib/components/game/VotingPhase.svelte';
  import RoundResults from '$lib/components/game/RoundResults.svelte';
  import ReadyCheck from '$lib/components/game/ReadyCheck.svelte';
  import GameOver from '$lib/components/game/GameOver.svelte';

  // UI Components
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Timer from '$lib/components/ui/Timer.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  let roomId = $derived($page.params.roomId);
  let showSettings = $state(false);
  let showNameModal = $state(false);
  let tempName = $state('');

  onMount(() => {
    if (!playerState.name) {
      showNameModal = true;
    } else {
      joinRoom();
    }
  });

  onDestroy(() => {
    gameState.leaveRoom();
  });

  function joinRoom() {
    if (playerState.name && roomId) {
      gameState.joinRoom(roomId, playerState.name);
    }
  }

  function handleNameSubmit() {
    if (tempName.trim().length >= 2) {
      playerState.setName(tempName.trim());
      showNameModal = false;
      joinRoom();
    }
  }

  function handleLeave() {
    gameState.leaveRoom();
    goto('/');
  }

  function handlePlayAgain() {
    // Reset to lobby
    gameState.leaveRoom();
    goto(`/room/${roomId}`);
  }

  // Computed
  const canStart = $derived(gameState.players.length >= MIN_PLAYERS);
</script>

<div class="max-w-lg mx-auto space-y-6 pb-24">
  <!-- Connection Status -->
  {#if connection.reconnecting}
    <div class="bg-warning/20 text-warning px-4 py-2 rounded-lg text-center">
      Reconectando...
    </div>
  {/if}

  {#if gameState.lastError}
    <div class="bg-error/20 text-error px-4 py-2 rounded-lg text-center">
      {$_(`errors.${gameState.lastError}`)}
    </div>
  {/if}

  <!-- LOBBY PHASE -->
  {#if gameState.phase === 'lobby'}
    <ShareLink roomId={roomId} />

    <PlayerList
      players={gameState.players}
      isHost={gameState.isHost}
      onKick={(id) => gameState.kickPlayer(id)}
    />

    {#if gameState.isHost}
      <div class="flex gap-2">
        <Button variant="ghost" onclick={() => (showSettings = true)}>
          <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {$_('lobby.settings')}
        </Button>
      </div>

      <HostControls
        players={gameState.players}
        currentPlayerId={playerState.id}
        {canStart}
        minPlayers={MIN_PLAYERS}
        onStartGame={() => gameState.startGame()}
        onKickPlayer={(id) => gameState.kickPlayer(id)}
        onTransferHost={(id) => gameState.transferHost(id)}
      />
    {:else}
      <div class="text-center">
        <Button
          variant={gameState.getMe()?.isReady ? 'outline' : 'primary'}
          size="lg"
          onclick={() => gameState.toggleReady()}
        >
          {gameState.getMe()?.isReady ? $_('lobby.not_ready') : $_('lobby.ready')}
        </Button>
        <p class="text-sm text-text-secondary mt-2">
          {$_('lobby.waiting_for_players')}
        </p>
      </div>
    {/if}

    <Button variant="ghost" fullWidth onclick={handleLeave}>
      {$_('common.back')}
    </Button>

  <!-- COUNTDOWN PHASE -->
  {:else if gameState.phase === 'countdown'}
    <div class="text-center space-y-4">
      <h2 class="text-2xl font-bold text-text-primary">{$_('game.get_ready')}</h2>
      {#if gameState.countdownRemaining !== null}
        <div class="text-8xl font-bold text-accent-primary animate-pulse-fast">
          {gameState.countdownRemaining}
        </div>
      {/if}
    </div>

  <!-- PLAYING PHASE -->
  {:else if gameState.phase === 'playing' || gameState.phase === 'basta_called'}
    <div class="space-y-4">
      <!-- Letter and Timer -->
      <div class="flex items-start justify-between">
        <LetterDisplay
          letter={gameState.currentLetter}
          round={gameState.currentRound}
          totalRounds={gameState.totalRounds}
        />
        {#if gameState.roundTimeRemaining !== null}
          <Timer seconds={gameState.roundTimeRemaining} size="lg" />
        {/if}
      </div>

      <!-- Basta Alert -->
      {#if gameState.phase === 'basta_called'}
        <div class="bg-accent-primary/20 text-accent-primary px-4 py-3 rounded-lg text-center animate-pulse-fast">
          <p class="font-bold">
            {$_('game.basta_called_by', { values: { name: gameState.bastaCalledByName ?? '' } })}
          </p>
          {#if gameState.graceTimeRemaining !== null && gameState.graceTimeRemaining > 0}
            <p class="text-sm mt-1">{$_('game.finish_writing')} ({gameState.graceTimeRemaining}s)</p>
          {/if}
        </div>
      {/if}

      <!-- Player Progress -->
      {#if gameState.config.showOthersProgress}
        <PlayerProgress
          players={gameState.players}
          currentPlayerId={playerState.id}
          totalCategories={gameState.config.categories.length}
        />
      {/if}

      <!-- Answer Form -->
      <AnswerForm
        categories={gameState.config.categories}
        answers={gameState.localAnswers}
        letter={gameState.currentLetter ?? ''}
        disabled={gameState.phase === 'basta_called' && gameState.graceTimeRemaining === 0}
        onAnswerChange={(cat, val) => gameState.updateAnswer(cat, val)}
      />
    </div>

    <!-- Basta Button -->
    {#if gameState.phase === 'playing'}
      <BastaButton onclick={() => gameState.callBasta()} />
    {/if}

  <!-- VOTING PHASE -->
  {:else if gameState.phase === 'voting' && gameState.allAnswers}
    <VotingPhase
      categories={gameState.config.categories}
      allAnswers={gameState.allAnswers}
      currentLetter={gameState.currentLetter ?? ''}
      currentPlayerId={playerState.id ?? ''}
      localVotes={gameState.localVotes}
      reactions={gameState.reactions}
      timeRemaining={gameState.votingTimeRemaining}
      isReady={gameState.isVotingReady}
      readyCount={gameState.votingReadyPlayers.size}
      totalPlayers={gameState.players.filter(p => p.isConnected).length}
      onVote={(cat, pid, valid) => gameState.vote(cat, pid, valid)}
      onReact={(cat, pid, reaction) => gameState.react(cat, pid, reaction)}
      onReady={() => gameState.markVotingReady()}
    />

  <!-- RESULTS PHASE -->
  {:else if gameState.phase === 'results' && gameState.roundResults}
    <RoundResults
      results={gameState.roundResults}
      categories={gameState.config.categories}
      currentPlayerId={playerState.id}
    />

  <!-- READY CHECK PHASE -->
  {:else if gameState.phase === 'ready_check'}
    <ReadyCheck
      players={gameState.players}
      currentPlayerId={playerState.id}
      timeRemaining={gameState.betweenRoundsTimeRemaining}
      onToggleReady={() => gameState.toggleReady()}
    />

  <!-- GAME OVER PHASE -->
  {:else if gameState.phase === 'game_over' && gameState.finalResults}
    <GameOver
      results={gameState.finalResults}
      currentPlayerId={playerState.id}
      onPlayAgain={handlePlayAgain}
      onBackToHome={handleLeave}
    />
  {/if}
</div>

<!-- Settings Modal -->
<Modal bind:open={showSettings} title={$_('config.title')}>
  <RoomConfig
    config={gameState.config}
    disabled={!gameState.isHost}
    onChange={(cfg) => gameState.updateConfig(cfg)}
  />

  {#snippet footer()}
    <Button variant="primary" fullWidth onclick={() => (showSettings = false)}>
      {$_('common.close')}
    </Button>
  {/snippet}
</Modal>

<!-- Name Input Modal -->
<Modal bind:open={showNameModal} title={$_('home.enter_name')}>
  <Input
    bind:value={tempName}
    placeholder={$_('home.enter_name')}
    maxlength={20}
    autofocus
    onkeydown={(e) => {
      if (e.key === 'Enter') handleNameSubmit();
    }}
  />

  {#snippet footer()}
    <div class="flex gap-2">
      <Button variant="ghost" onclick={() => goto('/')}>
        {$_('common.cancel')}
      </Button>
      <Button variant="primary" onclick={handleNameSubmit} disabled={tempName.trim().length < 2}>
        {$_('home.join')}
      </Button>
    </div>
  {/snippet}
</Modal>
