
Analysis of Email Client Dark Mode Color Transformation Algorithms


Executive Summary: Key Findings and Recommendations for Simulation Refinement


Overview of Findings

This investigation confirms that both Outlook and Gmail employ complex, proprietary algorithms for dark mode color transformation that go beyond simple mathematical inversion. The automatic color adjustments performed by these clients are not arbitrary; they are guided by distinct underlying philosophies. Outlook's engine is primarily driven by a dynamic, context-aware goal of maintaining accessibility through sufficient color contrast. In contrast, Gmail's engine (particularly on iOS) applies a more rigid, context-agnostic color inversion that, while predictable, can be highly disruptive to existing color schemes. The current simulation model, while a strong starting point, can be significantly enhanced by incorporating the more nuanced, client-specific logic uncovered in this report to achieve a higher degree of real-world fidelity.

Key Finding on Outlook

The research reveals that Outlook's transformation logic is not based on fixed lightness zones but on a dynamic, contrast-driven algorithm. Evidence from Outlook.com's client-side JavaScript, specifically a function named fixContrast(), indicates the primary goal is to programmatically achieve a WCAG-compliant contrast ratio of at least 4.5:1 between text and its background.1 The algorithm evaluates the contrast of a given color against its surrounding background color. If the contrast is insufficient, it recalculates the color's perceptual lightness, preserving its core hue and saturation, until the accessibility threshold is met.3 This behavior fundamentally challenges the current three-zone model, which relies on static lightness thresholds and cannot account for the critical context of the background color.

Key Finding on Gmail

Gmail's "Full Invert" mechanism, most notably observed on the Gmail iOS app, is not a simple HSL lightness flip but a predictable, formulaic inversion that can be reverse-engineered. The consistent success of community-developed CSS hacks that use a specific sequence of mix-blend-mode properties (difference and screen) to counteract Gmail's inversion provides a clear mathematical basis for a highly accurate simulation model.5 By understanding the mathematical operations of these blend modes, it is possible to deduce the inverse operation that Gmail itself is applying. This allows for the creation of a dedicated Gmail simulation model with a high degree of predictability, moving beyond generalized "soft inversion" logic.7

Core Recommendations

For the Outlook Model: It is recommended to evolve the current "lightness zone" model into a context-aware function that accepts both foreground and background colors as inputs. The simulation's objective should be to adjust the lightness of the input color in a perceptually uniform color space (such as CIELAB) until it meets a target contrast ratio of 4.5:1 against its given background. This approach directly mimics the observed behavior of Outlook's fixContrast() function and will provide a more accurate simulation for colors across the entire lightness spectrum.
For the Gmail Model: It is recommended to develop a new, dedicated simulation model for Gmail (iOS) based on the reverse-engineered logic from the mix-blend-mode hacks. This will involve applying a color transformation that is the mathematical inverse of the difference and screen blend mode operations. This approach treats Gmail's inversion as a solvable formula rather than an approximation, leading to a more precise and reliable simulation of its "Full Invert" behavior.
The following table provides a high-level summary of the core differences between the two clients' inversion philosophies.
Feature
Outlook (Partial Invert, e.g., Outlook.com)
Gmail (Full Invert, e.g., iOS App)
Core Logic
Context-aware, dynamic contrast adjustment
Context-agnostic, formulaic color inversion
Primary Goal
Achieve a minimum 4.5:1 contrast ratio for accessibility
Invert the color palette regardless of initial state
Predictability
Less predictable without background context; logic is complex
Highly predictable once the inversion formula is known
Key Characteristic
Adjusts colors only as needed to meet contrast targets
Inverts all colors, including already-dark themes
Community "Fix"
Targeting via [data-ogsc] and [data-ogsb] attributes
Counteracting inversion with CSS mix-blend-mode


Deconstructing Dark Mode Inversion: A Unified Theoretical Framework


The Spectrum of Inversion

The challenge of simulating dark mode transformations stems from the lack of a single, standardized implementation across email clients. The behavior can be categorized into three broad methodologies, each presenting a different level of complexity for email developers and simulation tools.8
No Change: A significant number of email clients, particularly for desktop webmail, apply dark mode styling only to their own user interface (UI) while leaving the HTML email content completely unaltered. From a rendering perspective, the email appears identical in both light and dark UI modes. This behavior is observed in clients like Apple Mail (for HTML emails), Gmail's desktop webmail, AOL, and Yahoo Mail.10 While this presents a jarring user experience—a bright white email inside a dark interface—it requires no color transformation simulation.
Partial Color Invert: This is the most common approach, employed by clients such as Outlook.com, Outlook mobile apps (iOS and Android), and the Gmail app for Android.8 This method attempts a "smart" inversion by detecting areas with light-colored backgrounds and inverting them to be dark, while simultaneously inverting any dark text on those backgrounds to become light. Crucially, areas that are already designed with a dark background and light text are often left untouched.8 This approach aims to create a consistent dark mode experience without disrupting emails that are already dark-mode-friendly.
Full Color Invert: This is the most aggressive and often most problematic methodology. Clients using this approach, most notably the Gmail app for iOS and Outlook for Windows, invert colors across the entire email, regardless of their original lightness.13 An email meticulously designed with a dark theme (e.g., light gray text on a charcoal background) will be "fixed" by having its colors inverted, resulting in a light theme (e.g., dark gray text on an off-white background).6 This context-agnostic approach is the most invasive and presents the greatest challenge for brand consistency and design integrity.

Foundational Inversion Models

At the heart of any dark mode simulation is a mathematical model for color transformation. The simplest models provide a baseline for understanding, while the more complex realities of client behavior require more sophisticated approaches.
"Pure" Mathematical Inversion: The most basic form of color inversion can be modeled in several ways. In the RGB color space, where each channel (Red, Green, Blue) has a value from 0 to 255, a pure inversion is calculated as  for each of the three channels. In the HSL (Hue, Saturation, Lightness) color space, this is often conceptualized as an inversion of the Lightness component, calculated as , where Lightness is a value between 0 and 1.16 This simple HSL model correctly transforms pure black (
) to pure white () and vice versa, while preserving the color's Hue and Saturation. This serves as the "pure invert" baseline in many conceptual models.
"Soft" or "Smart" Inversion: It is widely observed within the email development community that clients do not perform a pure, harsh inversion. Instead, they employ a "softening" technique. This process generally preserves the original hue and saturation of a color but adjusts its lightness in a more nuanced, non-linear fashion.14 The goal is to produce a color that is recognizably related to the original brand color but is appropriate for a dark background. For example, a bright, saturated brand blue might become a less intense, lighter pastel blue rather than being inverted to its complementary color, yellow. The
softInvert function in the current simulation model is an attempt to replicate this observed behavior. The research indicates this "softening" is not an arbitrary aesthetic choice but is governed by a more fundamental principle.

The Driving Force: Contrast Ratio and Accessibility

The primary motivation behind these automated color transformations is not merely aesthetic preference but a programmatic effort to maintain readability and meet accessibility standards. The consistent refrain across technical blogs and guides is that dark mode is intended to reduce eye strain, particularly in low-light conditions.10 This points toward a technical, rather than purely stylistic, objective.
The most critical piece of evidence supporting this conclusion comes from the deconstruction of Outlook.com's dark mode engine. Analysis by respected email developers revealed that Outlook.com's client-side script does not simply "flip" or "nudge" colors; it actively calculates the contrast ratio between a text color and its background.1 If the ratio is insufficient, a function, explicitly named
fixContrast(), is triggered to alter the color until a sufficient contrast is achieved.2
Further investigation into the purported source code of this function reveals a hardcoded constant: VALID_CONTRAST_VALUE = 4.5.4 This number is not arbitrary. A contrast ratio of 4.5:1 is the minimum requirement for normal text to meet the AA conformance level of the Web Content Accessibility Guidelines (WCAG) 2.1. This establishes a direct, verifiable link between Outlook's automatic color transformation and a specific, industry-standard accessibility target. This shifts the entire paradigm for simulation: the goal is not to guess at an aesthetic "softening," but to programmatically solve for a defined contrast ratio. Outlook's algorithm is, in effect, an automated accessibility remediation tool.

Deep Dive: Analysis of Outlook's Color Transformation Engine


Challenging the "Lightness Zone" Model

The current simulation model for Outlook, which uses three distinct "lightness zones" (OUTLOOK_DARK_ZONE_MAX = 0.3, OUTLOOK_LIGHT_ZONE_MIN = 0.75), is a logical and well-reasoned heuristic. It correctly intuits that Outlook treats colors differently based on their intrinsic lightness. Observations from the email community support this general principle, with reports that "Lighter BG colors will be darkened".8
However, the discovery of the contrast-driven fixContrast() function demonstrates that a static, zone-based model is an oversimplification. The transformation applied to any given color is not determined by its absolute lightness value in isolation, but by its contextual relationship to its background color.1 A mid-tone gray, for example, might fall into the "nudge darker" zone in the current model. In reality, Outlook's algorithm would render it unchanged if it were placed on a white background (where it already has sufficient contrast). Conversely, if that same gray were placed on a black background, the algorithm would force it to become significantly lighter to meet the 4.5:1 contrast requirement. The transformation is dynamic and relational, a behavior that a static zone model cannot capture.

Deconstructing the fixContrast() Algorithm (The Core Logic)

A detailed analysis of the transformElementForDarkMode.ts file, believed to be the source for Outlook.com's dark mode logic, reveals a sophisticated, multi-step process for color adjustment.4
Step 1: Contrast Check: The process begins by evaluating the existing color pair. The function isValidContrast(color1, color2) calculates the contrast ratio between the two colors and compares it to the constant VALID_CONTRAST_VALUE, which is set to 4.5. If the existing contrast is sufficient, no transformation is needed, and the function exits.
Step 2: Color Space Conversion: If the contrast is insufficient, the algorithm converts the color from its initial RGB representation into the CIELAB color space. The code explicitly references this with color.lab().array().4 The CIELAB space is designed to be more perceptually uniform than other color models, meaning that numerical changes in its values correspond more closely to changes perceived by the human eye. The algorithm specifically isolates the
 value, which represents perceptual lightness (from 0 for black to 100 for white).
Step 3: Calculating a New Perceptual Lightness ($L_{new}$):* This is the core of the transformation. The function calculates a new lightness value, newLValue, based on a complex formula. The logic involves inverting and scaling the current  value relative to the background color's lightness and a conceptual "midpoint." The clear intent is to shift the color's lightness to the opposite side of the perceptual spectrum from its background, thereby guaranteeing a significant increase in contrast. For example, if the background is light (high ), the new lightness for the foreground color will be calculated to be dark (low ).
Step 4: Recomposition and Conversion: A new color is then recomposed in the CIELAB space using the newly calculated newLValue while retaining the original  (green-red axis) and  (blue-yellow axis) values. This final step is critical, as it explains the widely observed phenomenon where Outlook's transformations preserve a color's essential hue and saturation.14 By only manipulating the perceptual lightness component, the algorithm ensures that a brand's blue remains blue, albeit a lighter or darker shade, rather than shifting to a different color entirely. The new CIELAB color is then converted back to RGB for rendering.
The use of the CIELAB color space is a particularly advanced detail. It indicates that the algorithm is not merely manipulating abstract numerical values but is attempting to model and adjust colors based on principles of human vision. This is a far more sophisticated process than a simple HSL lightness adjustment and explains why HSL-based simulations often fail to accurately predict Outlook's transformations, especially for highly saturated colors where calculated HSL lightness and perceived brightness can diverge significantly.

Before-and-After Transformation Matrix (Saturated & Brand Colors)

To validate a new contrast-based simulation model, it is essential to test it against real-world observed transformations. The following table catalogs specific before-and-after color pairs identified from various sources, providing concrete data points for testing and refinement.

Original Color
Original HEX
Transformed Color
Transformed HEX/RGB
Outlook Client
Source
White (Background)
#FFFFFF
Very Dark Gray
#262626
Outlook (General)
19
Black (Text)
#000000
Off-White
#F6F6F6
Outlook (General)
19
White (Background)
#FFFFFF
Dark Gray
rgb(51, 51, 51)
Outlook.com
2
Black (Text)
#000000
White
rgb(255, 255, 255)
Outlook.com
2
Brand Red
(not specified)
Light Pink
(not specified)
Outlook for Windows
20
Bright Yellow
(not specified)
Murky Brown
(not specified)
Outlook for Windows
20
Dark Purple (BG)
(not specified)
Lightened Purple
(not specified)
Outlook for Windows
20
Yellow-Green (Text)
(not specified)
Darkened Green
(not specified)
Outlook for Windows
20

These examples highlight the unpredictability of the transformations without considering context. The shift from a saturated red to a light pink, or a bright yellow to a murky brown, is a direct result of the algorithm solving for contrast against a likely light background, which forces a drastic and sometimes aesthetically unpleasing lightness adjustment.20 The pure white and black transformations are also key data points, showing that even these absolutes are mapped to specific shades of gray rather than being a simple flip.

The Role of Proprietary [data-ogsc] and [data-ogsb] Attributes

Further evidence of Outlook's client-side processing is its use of proprietary data attributes. When the fixContrast() script alters an element's color or background color, it stores the original, unaltered color value in one of two attributes: [data-ogsc] for "original style color" or [data-ogsb] for "original style background".2
This behavior serves two purposes. First, it provides a state-management mechanism for the client itself, allowing it to toggle between the original and transformed colors when the user clicks the "sun/moon" icon in the email header.21 Second, it provides a crucial targeting hook for savvy email developers. By using CSS attribute selectors like
[data-ogsc].my-class, developers can write styles that specifically apply only when Outlook's dark mode has been activated, allowing them to override or fine-tune the automatic adjustments.22 For simulation purposes, the existence of these attributes confirms that the transformation is a dynamic, post-parsing step applied by the client and reinforces the validity of analyzing the client-side script to understand the core logic.

Deep Dive: Analysis of Gmail's Color Inversion Algorithms (iOS & Android)


"Full Invert" on Gmail iOS: More Than a Simple Flip

The behavior of the Gmail app on iOS is consistently categorized as a "Full Invert".8 This is the most aggressive form of transformation, as it is applied universally to all colors in an email, regardless of their initial lightness. A critical characteristic of this approach is its context-agnostic nature; unlike Outlook, it does not evaluate the relationship between colors. This leads to the widely reported issue where an email already designed for dark mode (e.g., white text on a black background) is "corrected" by being inverted to black text on a white background, defeating the original design intent.6
While this behavior might seem like a simple lightness flip (e.g., ), the evidence gathered from sophisticated CSS workarounds suggests the underlying mathematical operation is more specific and complex.

Reverse-Engineering the Algorithm via mix-blend-mode Hacks

The most significant breakthrough in understanding Gmail's inversion logic comes from an ingenious CSS hack developed by email expert Rémi Parmentier.6 The technique, which successfully preserves a desired color scheme in Gmail's dark mode, relies on a nested application of CSS
mix-blend-mode properties. By analyzing how this fix works, one can reverse-engineer the transformation that Gmail is applying.
The core of the hack involves wrapping the target content (e.g., text) in two nested <div> elements. The innermost <div> is styled with mix-blend-mode: difference;, and its parent <div> is styled with mix-blend-mode: screen;.5 The fact that this specific sequence of mathematical operations perfectly neutralizes Gmail's inversion provides a powerful blueprint of the inversion itself.
The process can be broken down as follows:
Initial State and Gmail's Inversion: An element with background:#000; color:#fff; is inverted by Gmail's dark mode to become functionally equivalent to background:#fff; color:#000;.6
Step 1 of the Fix (mix-blend-mode: difference): The difference blend mode subtracts the darker color from the lighter color for each pixel. Its formula is , where  represents the color channel values. In this step, the now-black text () is blended against its parent's now-white background ().
For the text pixels: , which is white.
The result of this first blend is that the text is inverted back to white. The background of this inner <div> is also inverted, resulting in white text on a black background.
Step 2 of the Fix (mix-blend-mode: screen): The screen blend mode's formula is . This operation effectively lightens colors. The output of the difference blend (white text on a black background) becomes the source, which is then blended against the desired final background color of the outermost element.
For the text pixels (white source): Blending white with any backdrop color using the screen mode always results in white.
For the background pixels (black source): Blending black with any backdrop color using the screen mode always results in the backdrop color itself.
The final result is white text rendered perfectly on the desired background color.
This successful neutralization implies that Gmail's own transformation is a predictable mathematical operation. For a simulation, this is invaluable. Instead of approximating the effect, a model can be built to apply the inverse of the difference and screen operations, providing a highly accurate replication of Gmail's behavior.

Specific Before-and-After Examples for Gmail

The most direct example is the inversion of pure black and white. An element styled with <div style="background:#000; color:#fff;"> is transformed by Gmail iOS dark mode to render as if it were styled <div style="background:#fff; color:#000;">.6
However, the transformation is not a simple RGB inversion (). An example provided by Rémi Parmentier shows a purple, #639 (RGB 102, 51, 153), being transformed into a lighter purple, #c7a4ef (RGB 199, 164, 239). A pure RGB inversion of #639 would result in a greenish color (RGB 153, 204, 102). This strongly suggests that Gmail's algorithm operates within the HSL/HSV color space, primarily manipulating the lightness and possibly saturation values, while preserving the hue. The transformation from #639 (HSL: 278°, 50%, 40%) to #c7a4ef (HSL: 269°, 72%, 83%) shows a dramatic shift in lightness from 40% to 83%, along with a significant change in saturation, confirming a complex HSL-based manipulation rather than a simple lightness flip.

The linear-gradient Anomaly and Other Quirks

A widely documented quirk exploited by developers is that Gmail's inversion logic applies to the background-color and color CSS properties, but it does not parse or alter colors defined within a background-image property. This has led to the common hack of forcing a solid background color by declaring it as a gradient, for example: background-image: linear-gradient(#333, #333);.5
This anomaly provides a key piece of information about Gmail's rendering pipeline. It indicates that the dark mode color transformation is a specific, targeted process that runs on parsed CSS color values. It does not perform a blanket pixel inversion of the final rendered output. For a simulation, this reinforces that the logic should be applied at the level of CSS properties, and it explains why certain developer techniques are effective at preventing inversion.

Partial Inversion on Gmail Android

It is important to note that the Gmail app on Android behaves differently from its iOS counterpart. It employs a "Partial Invert" strategy, more akin to Outlook's, where it primarily targets light-colored areas and tends to leave already-dark designs alone.8
However, a critical flaw has been observed in this client: when live text is placed over a background image, Gmail for Android may invert the color of the text without considering the background image, which remains unchanged. This can lead to catastrophic readability issues, such as black text turning white over a light-colored background image, rendering it completely invisible.13 This behavior highlights a significant difference in contextual awareness between the Android and iOS apps and necessitates a separate simulation model or logic branch for Gmail on Android.

Expert Recommendations for Model Refinement


Critique of Current Simulation Logic

The existing simulation models provide a solid foundation but can be significantly improved in accuracy by incorporating the client-specific logic uncovered during this analysis.
Generic Models: The "pure" mathematical inversion and the "smart" inversion (triggered by a lightness threshold) serve as excellent baseline approximations. However, they do not capture the nuanced, proprietary behaviors of individual email clients, which is the primary goal of a high-fidelity simulation.
Advanced Outlook Model: The three-zone model based on lightness (dark, mid, light) is a clever and effective heuristic that correctly identifies that colors are treated differently based on their lightness. Its primary limitation is its static, context-agnostic nature. The research conclusively shows that Outlook's transformation logic is relational—the final color depends on its contrast with the background, not just its own intrinsic lightness. Therefore, the fixed thresholds (0.3, 0.75) are approximations that cannot account for the dynamic nature of the fixContrast() algorithm.

Proposed Algorithm for a Refined Outlook Model

To more accurately simulate Outlook's behavior, the model should be re-architected to be context-aware and goal-oriented, aiming to solve for a specific contrast ratio.
Function Signature: The core simulation function should be designed to accept two color arguments: simulateOutlook(foregroundColor, backgroundColor).
Core Logic: The algorithm should follow the principles of the fixContrast() function:
Calculate the contrast ratio between foregroundColor and backgroundColor.
If the calculated ratio is greater than or equal to 4.5, the function should return the original foregroundColor unmodified.
If the ratio is less than 4.5, the transformation logic is triggered:
a. Convert the foregroundColor to a perceptually uniform color space like CIELAB.
b. Implement a simplified version of the lightness adjustment logic observed in the fixContrast() source.4 A robust starting point would be to invert the perceptual lightness (
L∗new​=100−L∗original​) and then programmatically scale or adjust this new value to ensure it produces a color that meets the 4.5:1 contrast target against the backgroundColor.
c. Recompose the new color using the new L∗ value and the original a∗ and b∗ values.
d. Convert the resulting CIELAB color back to HEX or RGB for the final output.
This approach is computationally more complex than the current zone model but will yield vastly more accurate results, particularly for mid-tones and saturated brand colors that behave unpredictably in a simple HSL model.

Proposed Algorithm for a New Gmail (iOS) Model

Given the evidence that Gmail's "Full Invert" is a predictable formula, a new, dedicated model should be created.
Function Signature: As the transformation is context-agnostic, the function only requires a single argument: simulateGmailIOS(color).
Core Logic: The algorithm should be based on the reverse-engineered logic from the mix-blend-mode analysis. While the exact proprietary formula used by Google is unknown, its effects can be closely replicated.
Convert the input HEX/RGB color to the HSL color space.
Preserve the Hue (H) value, as major hue shifts are not generally observed.
Apply a non-linear transformation to the Lightness (L) and Saturation (S) values. A simple L_{new} = 1 - L_{old} is an insufficient starting point. The transformation observed with the purple color #639 (HSL: 278°, 50%, 40%) to #c7a4ef (HSL: 269°, 72%, 83%) provides a key data point. The simulation model should apply a curve or a piecewise function to the Lightness and Saturation channels that is fitted to these known input-output pairs. This will more accurately capture the "full invert" effect than a linear inversion.

Handling Known Edge Cases and Quirks

A high-fidelity simulation must also account for specific edge cases where clients deviate from their general algorithms.
Pure White/Black and Off-Whites/Blacks: Both Outlook and Gmail are known to treat pure #FFFFFF and #000000 differently than slightly off-white (#FEFEFE) or off-black (#010101) shades.17 The simulation should include explicit rules for these values. For instance, the Outlook model should transform
#FFFFFF to #262626 and #000000 to #F6F6F6, as documented in one source.19 Using off-whites and off-blacks is a common developer tactic to avoid these specific, sometimes undesirable, hardcoded transformations.
VML in Outlook: Colors defined within Vector Markup Language (VML), which is used to render buttons and other graphic elements in older versions of Outlook for Windows, are subject to yet another set of transformation rules that differ from standard CSS colors.26 While simulating VML rendering may be beyond the current scope, it is a known complexity that contributes to rendering inconsistencies.
Client Fragmentation: It is crucial to recognize that "Outlook" and "Gmail" are not monolithic entities. The behavior of dark mode differs significantly between Outlook for Windows (Full Invert), Outlook.com (Partial Invert, fixContrast()), Outlook for Mac (Partial Invert), and Outlook mobile apps (Partial Invert).11 Similarly, Gmail on iOS (Full Invert) behaves differently from Gmail on Android (Partial Invert). The most robust simulation tool would ideally allow the user to select the specific client target to apply the correct corresponding algorithm. The most actionable data found in this analysis pertains to Outlook.com (due to the available source code) and Gmail for iOS (due to the
mix-blend-mode analysis). These two clients represent the most complex and well-documented transformation algorithms and should be prioritized for implementation.
Works cited
Override outlook dark mode in html emails - Stack Overflow, accessed on October 3, 2025, https://stackoverflow.com/questions/65024543/override-outlook-dark-mode-in-html-emails
Dealing with Outlook.com's Dark Mode | by Rémi Parmentier | emails by HTeuMeuLeu, accessed on October 3, 2025, https://medium.com/emails-hteumeuleu/dealing-with-outlook-coms-dark-mode-dd56a1c0fdbc
Making Emails React to Outlook.com's Dark Mode - HTeuMeuLeu.com, accessed on October 3, 2025, https://www.hteumeuleu.com/2021/emails-react-outlook-com-dark-mode/
Outlook.com darkModeHandler - GitHub, accessed on October 3, 2025, https://gist.github.com/hteumeuleu/51b5a8ea95cb47e344b0cb47bc1f2289
How to force background color in gmail for Dark Mode? - Stack Overflow, accessed on October 3, 2025, https://stackoverflow.com/questions/75027005/how-to-force-background-color-in-gmail-for-dark-mode
Fixing Gmail's dark mode issues with CSS Blend Modes ..., accessed on October 3, 2025, https://www.hteumeuleu.com/2021/fixing-gmail-dark-mode-css-blend-modes/
Guide to color scheme in email - Parcel.io, accessed on October 3, 2025, https://parcel.io/guides/color-scheme-in-email
Ultimate Guide to Dark Mode [+ Code Snippets, Tools, Tips from the Email Community], accessed on October 3, 2025, https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers
Guide to dark mode - Parcel.io, accessed on October 3, 2025, https://parcel.io/guides/dark-mode
Email Dark Mode: The Complete Guide for Marketers | Customer.io, accessed on October 3, 2025, https://customer.io/learn/message-composing/email-dark-mode
How to prepare your email signature for dark mode, accessed on October 3, 2025, https://signature.email/guides/how-to-prepare-email-signature-dark-mode
Dark Mode in Emails: Guide for Omnisend Users, accessed on October 3, 2025, https://support.omnisend.com/en/articles/10118006-dark-mode-in-emails-guide-for-omnisend-users
The Dangers of Dark Mode for Email | Dyspatch, accessed on October 3, 2025, https://www.dyspatch.io/blog/the-danger-of-dark-mode-and-email/
Dark Mode: How to Invert Colors in Email Campaigns | by Ksenia Yugova | Medium, accessed on October 3, 2025, https://medium.com/@ksenia-yugova/dark-mode-how-to-invert-colors-in-email-campaigns-b99d85ef5bc8
How to fix email with dark mode : r/Frontend - Reddit, accessed on October 3, 2025, https://www.reddit.com/r/Frontend/comments/jztj62/how_to_fix_email_with_dark_mode/
Dark Mode: How It Works and How to Optimize for It - PixCraft, accessed on October 3, 2025, https://pixcraft.io/blog/dark-mode-how-it-works-and-how-to-optimize-for-it
Master the Art of Dark Mode Email Design and Coding, accessed on October 3, 2025, https://www.emailonacid.com/blog/article/email-development/dark-mode-for-email/
Dark Mode and email - Badsender, accessed on October 3, 2025, https://www.badsender.com/en/guides/dark-fashion-and-email/
Dark mode in Outlook finally released! See how it works - CodeTwo, accessed on October 3, 2025, https://www.codetwo.com/blog/dark-mode-in-outlook-owa/
Color Choices for Dark Mode - Knak | Help Center, accessed on October 3, 2025, https://help.knak.io/en/articles/6640326-color-choices-for-dark-mode
Dark Mode in Outlook - Microsoft Support, accessed on October 3, 2025, https://support.microsoft.com/en-au/office/dark-mode-in-outlook-3e2446e0-9a7b-4189-9af9-57fb94d02ae3
The Developer's Technical Guide to Coding Dark Mode Emails - Litmus, accessed on October 3, 2025, https://www.litmus.com/blog/coding-emails-for-dark-mode
Rémi Parmentier - Medium, accessed on October 3, 2025, https://medium.com/@hteumeuleu
Email design issues: Fixing color inversion in Gmail's dark mode - Latenode community, accessed on October 3, 2025, https://community.latenode.com/t/email-design-issues-fixing-color-inversion-in-gmails-dark-mode/8331
Improve email accessibility for light and dark modes - Dynamics 365 Customer Insights, accessed on October 3, 2025, https://learn.microsoft.com/en-us/dynamics365/customer-insights/journeys/email-dark-mode
matthieuSolente/email-darkmode - GitHub, accessed on October 3, 2025, https://github.com/matthieuSolente/email-darkmode
The Biggest Dark Mode Email Development Challenges - Email on ..., accessed on October 3, 2025, https://www.emailonacid.com/blog/article/email-development/dark-mode-email-development-challenges/
