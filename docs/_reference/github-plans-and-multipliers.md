A GitHub premium request is a specific type of interaction with GitHub Copilot that uses more advanced AI processing power. This new system was recently introduced by GitHub to manage usage of more powerful AI models in their Copilot service.

## What Is a Premium Request?

A premium request occurs when you use GitHub Copilot with advanced AI models beyond the base model. According to GitHub's documentation:

"A request is any interaction where you ask Copilot to do something for you—whether it's generating code, answering a question, or helping you through an extension. Each time you send a prompt in a chat window or trigger a response from Copilot, you're making a request."[1]

Premium requests specifically apply to interactions that use more computational resources and advanced AI capabilities.

## Features That Use Premium Requests

The following Copilot features can consume premium requests:

- Copilot Chat
- Copilot agent mode
- Copilot code review
- Copilot Extensions[1]

## How Premium Requests Differ From Regular Requests

The key differences between premium and regular requests are:

1. **Model Used**: Regular requests use the base model (currently OpenAI GPT-4o), while premium requests use more advanced models like GPT-4.5 or Claude 3.7 Sonnet[1][2]

2. **Usage Limits**:

   - For paid plans, regular requests with the base model are unlimited
   - Premium requests have monthly allowances based on your subscription tier[2]

3. **Cost Structure**: Once you exceed your premium request allowance, additional premium requests cost $0.04 USD each (if enabled)[1][3]

4. **Computational Power**: Premium requests consume more computational resources, which is reflected in their "multiplier" value[1]

## Model Multipliers

Each AI model has a specific premium request multiplier that determines how many requests are consumed per interaction:

| Model                         | Premium Request Multiplier |
| ----------------------------- | -------------------------- |
| Base model (for paid users)   | 0                          |
| Base model (for Copilot Free) | 1                          |
| Claude 3.5/3.7 Sonnet         | 1                          |
| Claude 3.7 Sonnet Thinking    | 1.25                       |
| Gemini 2.0 Flash              | 0.25                       |
| GPT-4.5                       | 50                         |
| GPT-4o                        | 1                          |
| o1                            | 10                         |
| o3-mini                       | 0.33                       |

For example, if you use GPT-4.5 to ask a question in Copilot Chat, that single interaction counts as 50 premium requests due to the model's high multiplier value.[1]

## Premium Request Allocations by Plan

Different GitHub Copilot subscription plans include different monthly allocations of premium requests:

- Copilot Free: 50 premium requests per month
- Copilot Pro: 300 premium requests per month
- Copilot Pro+: 1,500 premium requests per month
- Copilot Business: 300 premium requests per month
- Copilot Enterprise: 1,000 premium requests per month[1][2][3]

GitHub will begin enforcing billing for premium requests starting May 5, 2025 for individual plans and between May 12-19, 2025 for business and enterprise plans.[1][4]

Citations:
[1] https://docs.github.com/copilot/managing-copilot/monitoring-usage-and-entitlements/about-premium-requests
[2] https://github.blog/news-insights/product-news/github-copilot-agent-mode-activated/
[3] https://techcrunch.com/2025/04/04/github-copilot-introduces-new-limits-charges-for-premium-ai-models/
[4] https://docs.github.com/en/copilot/managing-copilot/managing-copilot-as-an-individual-subscriber/managing-your-copilot-plan/managing-copilot-policies-as-an-individual-subscriber
[5] https://docs.github.com/en/enterprise-cloud@latest/support/learning-about-github-support/about-github-premium-support
[6] https://github.com/enterprise/premium-support
[7] https://docs.github.com/en/enterprise-server@3.14/support/learning-about-github-support/about-github-premium-support
[8] https://github.com/features
[9] https://docs.github.com/code-security/getting-started/github-security-features
[10] https://github.com/features/copilot/plans
[11] https://docs.github.com/get-started/learning-about-github/githubs-products
[12] https://docs.github.com/en/copilot/about-github-copilot/subscription-plans-for-github-copilot
[13] https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions
[14] https://docs.github.com/copilot/managing-copilot/managing-copilot-as-an-individual-subscriber/about-github-copilot-free
[15] https://docs.github.com/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
[16] https://docs.github.com/articles/github-glossary
[17] https://docs.github.com/en/copilot/managing-copilot/managing-github-copilot-in-your-organization/managing-the-copilot-subscription-for-your-organization/about-billing-for-github-copilot-in-your-organization
[18] https://docs.github.com/get-started/learning-about-github/types-of-github-accounts
[19] https://docs.github.com/en/copilot/managing-copilot/monitoring-usage-and-entitlements/monitoring-your-copilot-usage-and-entitlements
[20] https://github.blog/news-insights/product-news/introducing-draft-pull-requests/
[21] https://www.reddit.com/r/github/comments/1dwv7o1/pull_requests_and_other_limitations_on_free_plan/
[22] https://graphite.dev/guides/comparing-github-enterprise-and-standard
[23] https://github.com/pricing
[24] https://github.blog/news-insights/product-news/introducing-unlimited-private-repositories/
[25] https://prismic.io/blog/gitlab-vs-github

---

Answer from Perplexity: pplx.ai/share
