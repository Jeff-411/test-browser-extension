# How to debug release errors on GitHub

## Step 1: Open the "Actions" tab

1.  Go to the repository: https://github.com/Jeff-411/test-browser-extension
2.  Click the "Actions" tab at the top

## Step 2: Access the problematic release

1. In the left-side menu, click "All workflows" if it is not already selected
2. In the "All Workflows" pane on the right side, click the problematic release (marked with a red X)

## Step 3: Access the error

1. In the left-side menu, click "Summary" if it is not already selected
2. In the "Annotations" pane (on the right side) click on the "build" item (marked with a red X)

## Step 4: Open the error

1. In the left-side menu, click "build" if it is not already selected
2. In the "build" pane (on the right side) click on the "Create Release" option (marked with a red X)
3. At the top of the "build" pane, click the "Explain Error" button.

This will open a chat session with GitHub Copilot.

## Step 5: Chat with GitHub Copilot

The Copilot chat window opens with a default prompt asking for help with the failed Create Release job. Review the suggested fix, and continue the chat if required.

**Tip**: Click the (2nd from right) icon in the chat window toolbar to chat in a full-size window.
