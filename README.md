# Concrescence

Concrescence is a small, interactive web-based simulation inspired by Terence McKenna's Novelty Theory. It's a minimalist "game" that explores the cosmic struggle between **Habit** (the tendency towards repetition and stability) and **Novelty** (the emergence of new, complex, and self-organizing forms).

The goal is to overcome the pull of Habit and guide the universe toward a state of "Concrescence"—a term McKenna used to describe a theoretical end-state of maximum complexity and interconnectedness.

## Gameplay & Features

*   **Create Novelty:** Click on grey "Habit" squares to transform them into magenta "Novelty" sparks.
*   **Combat Decay:** Novelty is fragile. Left alone, it will decay back into Habit. You must act to keep the momentum going.
*   **Foster Complexity:** When two Novelty sparks collide, they merge into a more stable, circular "Complex Form."
*   **Self-Organization:** Complex Forms passively generate their own Novelty, helping you push back against the universal tide of Habit.
*   **Visual Evolution:** As the total Novelty in the system increases, the simulation evolves visually with new particle effects, connections, and emergent behaviors.
*   **Reach Concrescence:** Fill the Novelty bar to 100% to win the game and trigger the final event.
*   **Prestige System:** After achieving Concrescence, you can begin a new cycle at a higher "Prestige Level," where Habit is stronger and the challenge is greater.

## A Note on the Development Process

**This project was developed almost entirely by a human user interacting with the Gemini CLI coding agent.**

The user provided high-level goals, feature requests, layout ideas, and bug reports in plain English. The Gemini agent was responsible for:

*   Writing all of the HTML, CSS, and JavaScript code.
*   Refactoring the application structure (e.g., moving from a simple layout to a CSS Grid).
*   Implementing all game logic, including the physics, audio, and state management.
*   Debugging issues (from logical errors to JavaScript race conditions).
*   Staging and committing changes to the Git repository with descriptive messages.

This project serves as a practical case study in AI-assisted software development, demonstrating a collaborative workflow between a human director and an AI agent executor.

## How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd your-repo-name
    ```
3.  **Start a local web server.**
    This project is a simple static website and requires a server to run correctly in a browser. The easiest way is to use Python's built-in server.

    If you have Python 3 installed:
    ```bash
    python3 -m http.server 8081
    ```

    If you have Python 2 installed:
    ```bash
    python -m SimpleHTTPServer 8081
    ```

4.  **Open the game in your browser:**
    Navigate to `http://localhost:8081`

## Technology Stack

*   **HTML5**
*   **CSS3** (including CSS Grid)
*   **Vanilla JavaScript (ES6+)**
*   **Web Audio API**

---

This project is open source and available under the MIT License.
