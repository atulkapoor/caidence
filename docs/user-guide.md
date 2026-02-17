# C(AI)DENCE User Guide

This guide covers all 17 modules available in C(AI)DENCE. Each module is accessible from the main navigation once you are logged in and have the appropriate permissions for your role.

---

## 1. Dashboard

**Route:** `/dashboard`

The Dashboard is the home screen of C(AI)DENCE. It displays an at-a-glance summary of your most important KPIs — active campaigns, total creators, AI generation credits used, and recent activity. Quick-action cards allow you to jump directly into content creation, campaign planning, or creator discovery without navigating through the full module.

---

## 2. Campaign Management

**Route:** `/campaigns`

Campaign Management provides a multi-step wizard for planning and executing marketing campaigns. You can define objectives, select target audiences, set budgets, and compare competing campaign plans side-by-side using the Tie-Breaker Comparator. Campaigns track status (draft, active, completed) and are linked to creators, budgets, and deliverables throughout their lifecycle.

---

## 3. Content Studio

**Route:** `/content-studio`

Content Studio is the AI-powered text generation workspace. You can generate marketing copy, social media posts, blog articles, email campaigns, and ad scripts by providing a prompt and selecting tone and format options. Generated content is saved to a history log so you can review, edit, and re-use previous outputs. Requires the `content_studio:read` and `content_studio:write` permissions.

---

## 4. Design Studio

**Route:** `/design-studio`

Design Studio provides AI image generation capabilities for creating brand assets, social visuals, and ad creatives. You enter a prompt describing the desired image, select style parameters, and the system generates candidates you can save or download. A design history panel tracks all previously generated images for your account. Requires the `design_studio:read` and `design_studio:write` permissions.

---

## 5. Presentation Studio

**Route:** `/presentation-studio`

Presentation Studio automates the creation of slide decks using AI. Provide a topic, outline, or brief, and the module generates a structured presentation with slide titles, talking points, and suggested visuals. Completed presentations are saved in your history for export and future editing. Requires the `presentation_studio:read` and `presentation_studio:write` permissions.

---

## 6. Workflow Automation

**Route:** `/workflow`

Workflow Automation provides a visual builder for constructing multi-step automated marketing workflows. You can chain triggers, conditions, and actions — such as content generation, campaign updates, or notifications — into reusable workflows. The runs panel shows the execution history for each workflow, including status and any errors encountered.

---

## 7. AI Chat

**Route:** `/ai-chat`

AI Chat is a conversational assistant powered by Ollama (local LLM inference). Use it to ask questions, brainstorm campaign ideas, summarize documents, or get guidance on platform features. Conversations are scoped to your session and the interface supports multi-turn dialogue. Requires the `ai_chat:read` permission.

---

## 8. AI Agent

**Route:** `/ai-agent`

AI Agent provides autonomous, goal-based marketing execution. You define an objective — such as "plan a product launch campaign" — and the agent breaks it down into subtasks, executes steps, and reports progress. Unlike the conversational AI Chat, the Agent takes autonomous actions within the platform to complete longer-horizon tasks. Requires the `ai_agent:read` and `ai_agent:write` permissions.

---

## 9. CRM

**Route:** `/crm`

The CRM module tracks your relationships with influencers and creators. Each contact record stores partnership history, campaign participation, performance metrics, and notes. The module supports generating X-Ray relationship reports and calculating ROI per contact. Requires the `crm:read` permission to view and `crm:write` to create or update records.

---

## 10. Analytics

**Route:** `/analytics`

Analytics provides real-time performance dashboards covering campaign metrics, content engagement, creator performance, and competitor tracking with sentiment analysis. Charts are built with Recharts and support filtering by date range, brand, and campaign. Social listening data surfaces trending topics and audience signals relevant to your brands.

---

## 11. Discovery Engine

**Route:** `/discovery`

The Discovery Engine is an AI-powered influencer search tool. You can search by content style, image recognition signals, voice/tone analysis, and audience demographics. The Influencers Club section surfaces a curated set of pre-vetted creators. Credibility Scores and Fake Follower Detection help assess the quality of potential partners before outreach.

---

## 12. MarCom Hub

**Route:** `/marcom`

The MarCom Hub centralizes marketing communications management. It includes tools for planning outreach, tracking communications status, and running marketing calculators (such as reach estimation and cost-per-engagement projections). The module connects to campaign and creator data so communication activities are always in context.

---

## 13. Creator Management

**Route:** `/creators`

Creator Management is the roster view for all creators associated with your agency or brand. Each record shows platform handles, audience size, engagement rate, tier classification, and campaign history. Admins can add new creators, update profile data, and link creators to active campaigns. Requires the `creators:read` permission to view.

---

## 14. Agency Hub

**Route:** `/agency`

Agency Hub provides agency-level management for brands and teams. Agency admins can view all brands under their organization, manage team membership, assign roles, and track aggregate performance across the brand portfolio. The tab structure separates brand management, team management, and organization-level settings.

---

## 15. Creator Portal

**Route:** `/creator-portal`

The Creator Portal is a self-service interface for creators who are part of the platform. Creators can view their active campaign briefs, submit content deliverables, track payment status, and review their performance history — all without requiring access to the full agency-facing interface.

---

## 16. Settings

**Route:** `/settings`

Settings allows users to manage their profile, notification preferences, connected accounts, and security options (such as password changes). Organization admins will also see team and billing configuration options in this section depending on their role.

---

## 17. Admin Panel

**Route:** `/admin`

The Admin Panel is the platform management console restricted to users with the `admin:read` permission. It provides tabs for platform overview statistics, user management (approve, invite, and manage users), access control (per-user permission overrides), role management (view and edit the role permissions matrix), audit logs, organization management, and billing overview. See the [Admin Guide](./admin-guide.md) for full details.
