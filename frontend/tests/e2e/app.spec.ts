import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
})

test('renders redesigned login screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tic-Tac-Toe with a polished multiplayer feel.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Enter your name' })).toBeVisible()
  await expect(page.getByPlaceholder('Nickname')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play as Guest' })).toBeVisible()
  await expect(page).toHaveScreenshot('login-redesign.png', {
    animations: 'disabled',
  })
})

test('supports guest login through lobby to a waiting game', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play as Guest' }).click()

  await expect(page).toHaveURL(/\/lobby$/)
  await expect(page.getByTestId('lobby-match-card')).toBeVisible()
  await expect(page.getByTestId('lobby-match-card')).toHaveScreenshot('lobby-match-card.png', {
    animations: 'disabled',
  })

  await page.getByRole('button', { name: 'Create Room' }).click()

  await expect(page).toHaveURL(/\/game\//)
  await expect(page.getByTestId('game-board-card')).toBeVisible()
  await expect(page.getByTestId('game-board-wrap')).toHaveScreenshot('game-waiting-board.png', {
    animations: 'disabled',
  })
})
