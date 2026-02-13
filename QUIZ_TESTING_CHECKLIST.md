# Quiz Game Improvements - Testing Checklist

## Pre-Release Testing Guide

### Feature 1: Answer Feedback + Live Score Update

#### Test Case 1.1: Correct Answer Selection

```
Steps:
1. Start game and get to first question
2. Select the CORRECT answer
3. Verify button is disabled immediately
4. Verify button gets pink highlight with border
5. Wait for timer to reach 0
6. Verify correct answer shows GREEN background
7. Verify score updates (+100 points)
8. Verify "Correct! +100 points!" message displays
9. Wait 2 seconds
10. Verify auto-advance to leaderboard/next question

Expected Results:
✓ Button disabled on click
✓ Pink visual highlight (no green/red yet)
✓ Green highlight appears at t=0
✓ Score increases
✓ Auto-advance works
```

#### Test Case 1.2: Wrong Answer Selection

```
Steps:
1. Select a WRONG answer
2. Verify button disabled immediately
3. Verify pink highlight applied
4. Wait for timer to reach 0
5. Verify correct answer shows GREEN
6. Verify selected wrong answer shows RED
7. Verify score does NOT increase
8. Verify "Incorrect! Better luck..." message displays

Expected Results:
✓ Wrong answer button shows RED at time end
✓ Correct answer shows GREEN regardless
✓ Score unchanged
✓ Both colors visible for comparison
```

#### Test Case 1.3: No Answer Selected (Timeout)

```
Steps:
1. Do not select any answer
2. Wait for timer to reach 0
3. Verify correct answer shows GREEN
4. Verify message: "Time's up! No answer selected."
5. Verify score decreases (-50 points)

Expected Results:
✓ Timer end triggers reveal
✓ Green highlight on correct answer
✓ Penalty applied (-50)
✓ Auto-advance works
```

#### Test Case 1.4: Score Display Update

```
Steps:
1. Check score display at top of screen
2. Answer question correctly
3. Verify score updates IMMEDIATELY when timer ends
4. Check score is still visible/updated between questions

Expected Results:
✓ Live score update (no delay)
✓ Score visible throughout game
✓ Score persists in leaderboard
```

#### Test Case 1.5: State Reset Between Questions

```
Steps:
1. Answer question 1
2. Proceed to question 2
3. Verify question 2 has:
   - No blue/pink highlights on buttons
   - All buttons enabled
   - 10 second timer reset
   - Clear question text

Expected Results:
✓ No visual artifacts from previous question
✓ All buttons functional
✓ Fresh timer display
```

#### Test Case 1.6: Prevent Duplicate Score Updates

```
Steps:
1. Use browser DevTools to check allPlayers array
2. Answer a question correctly
3. Check allPlayers[0].score in console
4. Verify it only increments once (not twice)
5. Proceed to another question
6. Repeat check

Expected Results:
✓ Score updates exactly once per question
✓ No duplicate increments
✓ Multiplayer sync works correctly
```

---

### Feature 2: Podium Animation

#### Test Case 2.1: Sequential Appearance

```
Steps:
1. Complete all quiz questions to trigger podium
2. Watch podium appear
3. Measure timing:
   - Note when 3rd place appears (should be ~0s)
   - Note when 2nd place appears (should be ~2s)
   - Note when 1st place appears (should be ~4s)
4. Count total time to completion (~6s)

Expected Results:
✓ 3rd place appears FIRST (smooth rise + fade)
✓ 2 second delay
✓ 2nd place appears
✓ 2 second delay
✓ 1st place appears (trophy)
✓ Character screen appears after ~6 seconds
```

#### Test Case 2.2: Animation Quality

```
Steps:
1. Watch each podium appearance
2. Verify smooth upward movement
3. Verify fade-in effect (opacity changes smoothly)
4. Check for stuttering or jumpy animation
5. Verify no overlapping animations

Expected Results:
✓ Smooth ease-out animation (not linear)
✓ Fade and rise happen together
✓ No jank/stuttering
✓ Each animation takes ~1 second
✓ Proper z-index stacking (3rd, then 2nd, then 1st)
```

#### Test Case 2.3: Podium Height Accuracy

```
Steps:
1. Observe podium heights during animation
2. Verify proportions:
   - 1st place tallest
   - 2nd place medium
   - 3rd place shortest

Expected Results:
✓ Height hierarchy maintained
✓ Proportional visual difference
```

#### Test Case 2.4: Avatar Display

```
Steps:
1. Watch podium animation
2. Verify avatars are visible:
   - Characters shown above podiums
   - No circular crop (full images)
   - All three avatars visible

Expected Results:
✓ All avatars visible
✓ Proper SVG/image rendering
✓ No cutoff or distortion
```

---

### Feature 3: Final Character Result Screen

#### Test Case 3.1: Rank 1 (Winner) Screen

```
Steps:
1. Arrange players so current player wins (highest score)
2. Complete podium animation
3. Observe character screen

Expected Results:
✓ 🏆 emoji displays
✓ Message: "Champion! Outstanding performance!"
✓ Rank shows "#1 of X players"
✓ Character pulses (subtle)
✓ Emoji bounces in
✓ Text fades in sequentially
```

#### Test Case 3.2: Rank 2 Screen

```
Steps:
1. Arrange so current player is #2
2. Complete game

Expected Results:
✓ 😊 emoji displays
✓ Message: "Great job! Almost there!"
✓ Rank shows "#2 of X players"
```

#### Test Case 3.3: Rank 3 Screen

```
Steps:
1. Arrange so current player is #3
2. Complete game

Expected Results:
✓ 👌 emoji displays
✓ Message: "Nice effort! Keep pushing!"
✓ Rank shows "#3 of X players"
```

#### Test Case 3.4: Last Place Screen

```
Steps:
1. Arrange so current player is last
2. Complete game

Expected Results:
✓ 💪 emoji displays
✓ Message: "We'll get them next time!"
✓ Rank shows "#X of X players"
✓ Still motivational (not depressing)
```

#### Test Case 3.5: Avatar Display

```
Steps:
1. Observe character screen
2. Verify character displays correctly:
   - SVG or image renders
   - Positioned in circular container
   - Properly sized

Expected Results:
✓ Character displays clearly
✓ Circular background gradient visible
✓ No sizing issues
```

#### Test Case 3.6: Animations

```
Steps:
1. Watch character screen appear
2. Observe animation sequence:
   - Avatar with pulse effect
   - Emoji bounces in
   - Screen slides up
   - Text fades in (staggered)
3. Check timing of text reveals

Expected Results:
✓ Avatar pulses smoothly (infinite loop)
✓ Emoji bounces from top
✓ Screen slides up smoothly
✓ Text appears in sequence with delays
✓ Button fades in last
```

#### Test Case 3.7: Final Score Display

```
Steps:
1. Observe character screen
2. Check final score is displayed
3. Verify score matches quiz results

Expected Results:
✓ Score visible and accurate
✓ Gold color (#ffd700)
✓ Positioned clearly
```

#### Test Case 3.8: "View Leaderboard" Button

```
Steps:
1. Click "View Leaderboard" button
2. Verify transition to final leaderboard
3. Check all players are listed
4. Verify scores are correct

Expected Results:
✓ Button is clickable
✓ Smooth transition to leaderboard
✓ Final leaderboard shows all players
✓ Scores match character screen display
```

---

### Feature Integration Tests

#### Test Case 4.1: Full Game Flow

```
Steps:
1. Join game
2. Mark ready
3. Wait for game to start
4. Answer all questions (mix of correct/wrong/timeout)
5. Observe complete flow

Expected Results:
✓ Answers show visual feedback immediately
✓ Correct/wrong revealed at timer end
✓ Score updates live
✓ Progress to next question after 2s
✓ Leaderboard shows between questions
✓ After all: podium animates
✓ After podium: character screen
✓ After character: final leaderboard
```

#### Test Case 4.2: Multiplayer Sync

```
Steps:
1. Have 2+ players in same session
2. Each plays through quiz
3. Check scoreboards:
   - Between-questions leaderboard
   - Podium display
   - Final leaderboard

Expected Results:
✓ All players' scores visible to all
✓ Leaderboard ranks correct
✓ Podium shows top 3 from all players
✓ Each player sees their own character screen
✓ Final leaderboard shows all players
```

#### Test Case 4.3: Session Persistence

```
Steps:
1. Play through game
2. Check browser console
3. Verify sessionStorage still has:
   - sessionId
   - userId
   - username
   - joinCode

Expected Results:
✓ Session data preserved
✓ Can navigate back to join page
✓ Can rejoin same session (if applicable)
```

#### Test Case 4.4: Supabase Integration

```
Steps:
1. Play through quiz
2. Open Database Inspector
3. Check responses table:
   - Should have entries for each answer
   - question_id, selected_option, is_correct recorded
   - Timestamp present

Expected Results:
✓ Responses saved correctly
✓ Correct/incorrect marked accurately
✓ No duplicate entries
✓ All players' responses saved
```

---

### Edge Cases & Error Handling

#### Test Case 5.1: Rapid Answer Changes

```
Steps:
1. Try to click multiple answers quickly
2. First click should register
3. Subsequent clicks should be ignored

Expected Results:
✓ Only first answer counts
✓ Button disabled prevents clicking
✓ No duplicate responses saved
```

#### Test Case 5.2: Browser Back Button

```
Steps:
1. During game, try pressing back button
2. Should redirect or block appropriately

Expected Results:
✓ Game session preserved
✓ No corrupted state
```

#### Test Case 5.3: Tab Switch

```
Steps:
1. Play game
2. Switch tabs during question
3. Return to game tab
4. Timer should continue
5. Answer the question

Expected Results:
✓ Timer continues in background
✓ Game state preserved
✓ Can still answer when returning
```

#### Test Case 5.4: Single Player

```
Steps:
1. Join game alone (no other players)
2. Complete quiz
3. Check podium:
   - Should show current player 3 times? OR
   - Should show "Player 1" for all slots? OR
   - Handle gracefully

Expected Results:
✓ No crashes
✓ Graceful handling of single player
✓ Character screen still displays
```

#### Test Case 5.5: Very Low Scores

```
Steps:
1. Answer all questions wrong
2. Get -50 points repeatedly
3. Check if score goes negative
4. Check podium ranking

Expected Results:
✓ Score correctly calculated (may be negative)
✓ Still ranks at bottom
✓ Still sees character screen
✓ No math errors
```

---

### Mobile Testing

#### Test Case 6.1: Mobile Viewport

```
Steps:
1. Open game on mobile device (375px width)
2. Answer questions
3. Check responsive behavior:
   - Buttons fit screen
   - Text readable
   - Timer visible
   - All elements responsive

Expected Results:
✓ No horizontal scroll needed
✓ Buttons touch-friendly (48px+ target)
✓ Text legible on small screen
✓ Animations smooth on mobile
```

#### Test Case 6.2: Mobile Touch

```
Steps:
1. On mobile, tap answer buttons
2. Verify touch feedback:
   - Visual highlight immediate
   - No delay

Expected Results:
✓ Touch responsive
✓ No ghost touches
✓ Haptic feedback optional
```

---

### Performance Testing

#### Test Case 7.1: Animation Frame Rate

```
Steps:
1. Open browser DevTools (Performance tab)
2. Play through game with animations
3. Check FPS during:
   - Answer selection
   - Timer countdown
   - Podium appearance
   - Character screen

Expected Results:
✓ 60 FPS maintained (or phone refresh rate)
✓ No significant frame drops
✓ Smooth animations throughout
```

#### Test Case 7.2: Memory Usage

```
Steps:
1. Open DevTools (Memory tab)
2. Start game, play 5 questions
3. Check memory:
   - Should not grow unbounded
   - No major leaks

Expected Results:
✓ Memory stable
✓ No increasing leak pattern
```

---

### Accessibility Testing

#### Test Case 8.1: Keyboard Navigation

```
Steps:
1. Try Tab to navigate between buttons
2. Try Enter to select answer
3. Try Space to click buttons

Expected Results:
✓ Keyboard accessible
✓ Tab order logical
✓ Enter/Space activates buttons
```

#### Test Case 8.2: Color Contrast

```
Steps:
1. Check answer button colors
2. Check text on backgrounds
3. Verify contrast ratio 4.5:1

Expected Results:
✓ Text readable on all backgrounds
✓ Color blindness friendly
✓ Green/red not only differentiator
```

#### Test Case 8.3: Screen Reader

```
Steps:
1. Enable screen reader
2. Navigate through game
3. Verify announcements:
   - Question text read
   - Answer options read
   - Score announced
   - Results announced

Expected Results:
✓ All content announced
✓ Context clear without visuals
✓ Animations described if needed
```

---

## Quick Validation Checklist

Before deployment, verify:

- [ ] All three features implemented correctly
- [ ] No console errors during gameplay
- [ ] Score updates accurate (no duplication)
- [ ] Podium animates in correct sequence (3rd→2nd→1st)
- [ ] Character screen shows correct rank/emoji/message
- [ ] Final leaderboard displays all players
- [ ] Multiple players sync correctly
- [ ] Mobile responsive
- [ ] Animations smooth (60 FPS)
- [ ] Supabase integration working
- [ ] Session persistence maintained
- [ ] No breaking changes to existing features
- [ ] Button disabled after selection
- [ ] Visual feedback shows immediately
- [ ] Correct/wrong only shows at timer=0
- [ ] Score updates live (no reload)
- [ ] State resets per question
- [ ] No duplicate Supabase entries
- [ ] All emoji/messages display correctly
- [ ] Hover effects work on buttons
- [ ] Next question button works
- [ ] Leave game functionality intact

---

## Known Limitations

1. **Single Player Without Others**: Game handles gracefully but all podium slots show current player
2. **Network Latency**: Supabase insert may lag (intended, not blocking)
3. **Animation Speed**: Fixed 2-second delays (could be customizable in future)
4. **Score Calculation**: Simple +100/-50 (could add speed bonuses)

## Future Enhancements

- [ ] Sound effects for correct/wrong
- [ ] Custom character expressions
- [ ] Confetti for 1st place
- [ ] Speed bonus calculations
- [ ] Replay button after results
- [ ] Share score functionality
- [ ] Leaderboard history
