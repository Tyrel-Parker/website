---
title: Building My Personal Website with Vanilla HTML, CSS, and JavaScript
datePublished: 2025-07-26
category: Tutorial
readTime: 2 min read
wordCount: 274
excerpt: How I built a modern, responsive personal website using only vanilla web technologies and GitHub Pages.
tags: ["web-development", "tutorial", "vanilla-js", "github-pages"]
---

When I decided to build my personal website, I had a choice to make: use a modern framework like **React** or **Next.js**, or stick with the fundamentals. I chose vanilla HTML, CSS, and JavaScript, and here's why.

<img src="../assets/images/blog/website-homepage.png" alt="Homepage design" class="blog-image center">

First, let me explain my requirements. I wanted a site that could showcase my applications, photography, book reviews, and eventually a blog. I needed it to be *fast*, *maintainable*, and *easy to deploy*.

The decision to go vanilla wasn't just about simplicity—it was about understanding the web platform at its core. Every framework is built on these fundamentals, so mastering them makes you a better developer overall.

For the design, I went with a modern gradient background and glassmorphism effects. The CSS uses `backdrop-filter` for that nice blurred glass effect you see on the cards. Here's a key snippet:

<div class="blog-code">/* Glassmorphism effect */
.container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}</div>

<img src="../assets/images/blog/css-glassmorphism.png" alt="Glassmorphism effect example" class="blog-image small center">

The JavaScript architecture is modular. I separated concerns by using JSON files for data and keeping the logic clean. Each section (apps, photography, books) loads its data independently.

> "Sometimes the simple approach is the best approach." - This became my mantra throughout the project.

One interesting challenge was implementing the expandable book reviews. I used CSS transitions with `max-height` to create smooth expand/collapse animations without JavaScript animation libraries.

Deployment to GitHub Pages was straightforward—just push to the main branch and enable Pages in the repository settings. **No build process needed!**

The result? A fast-loading, maintainable website that showcases my work effectively. Sometimes the simple approach is the best approach.