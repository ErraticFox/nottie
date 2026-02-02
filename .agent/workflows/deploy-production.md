---
description: Safe production deployment with testing, building, and verification steps.
---

---
description: Deploy application to production with safety checks
---

1. Verify we're on the main branch.
2. Pull latest changes to ensure we're up to date.
// turbo
3. Run git pull origin main
4. Run all tests to ensure code quality.
// turbo
5. Run npm test
6. Build the production bundle.
// turbo
7. Run npm run build
8. Verify build completed successfully (check for build errors).
9. Ask user for final confirmation before deploying.
10. Deploy to production.
11. Verify deployment succeeded by checking the live URL.
12. Create a git tag for this release.
// turbo
13. Run git tag -a v[version] -m "Production release [version]"
14. Push the tag to remote.
// turbo
15. Run git push origin v[version]