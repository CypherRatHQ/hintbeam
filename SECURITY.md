# Security

Hintbeam runs entirely inside your app. It makes no network calls, stores only tour progress (via
the storage adapter you provide), and renders only text your developers wrote. Guide text is
validated as plain single-line words so a guide loaded from JSON cannot inject markup.

## Reporting a vulnerability

Please do not open a public issue. Report it privately through GitHub: open the repository's
**Security** tab and choose **Report a vulnerability**. Only the maintainers can see the report.
Include a reproduction if you can.

- Acknowledgement within **3 working days**.
- An assessment and, where warranted, a fix or mitigation within **14 days**.
- Credit in the changelog unless you prefer otherwise.

## Scope

In scope: anything in this repository's published package. Out of scope: vulnerabilities in
React Native, Expo, react-native-svg or your own app code.
