# Coding Standards

## Naming Conventions
- **Variables/Functions:** camelCase
- **Classes/Interfaces:** PascalCase
- **Constants:** UPPER_SNAKE_CASE
- **Files/Folders:** kebab-case
- Names must be intention-revealing (e.g., `calculateTotal` instead of `calc`). Avoid comments that explain "what" the code does; the name should be enough.

## Function Size and Responsibilities
- Functions should be small and do one thing (Single Responsibility Principle).
- Maximum function length: 20-25 lines of code.

## Testing Policy
- All new features and bug fixes must include automated tests.
- Commits must leave the repository compiling and with all tests passing (green).

## Code Smells and Mitigations
| Code Smell | Mitigation in this Project |
|---|---|
| Primitive Obsession | Use Value Objects (e.g., `Money`, `SeatNumber`, `FlightNumber`, `PassengerCount`). |
| Magic Numbers | Use named constants or external configuration (e.g., `MAX_PASSENGERS_PER_BOOKING = 9`). |
| God Class / Long Method | Separate Use Cases, one file per responsibility. |
| Feature Envy / Anemic Model | Place rules inside entities (e.g., `Seat.hold()`, `Booking.confirm()`). |
| Shotgun Surgery | Have a single place for each business rule. |
| Duplication | Refactor and extract only when there are three real repetitions. |
| Secrets in Repo | Use environment variables, version `.env.example`. |

## Commit Conventions
- Use Conventional Commits format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `perf`.
- Commits should be atomic and represent a single logical change.
