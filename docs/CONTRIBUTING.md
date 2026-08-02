# Contributing to Enterprise AI Financial Analyst

## Code Guidelines & Standards

1. **Decoupling Principles**:
   - Never import business logic across module boundaries directly. Use late-bound lazy getters (e.g. `_get_sec_engine()`) inside method bodies to prevent circular dependencies.
2. **Type Safety & Models**:
   - All models must be strict Python `@dataclass` or TypeScript interfaces with `to_dict()` serialization.
3. **Thread Safety**:
   - Use `threading.RLock()` for mutative operations on engine singletons.
4. **Testing**:
   - Every pull request must include unit tests in `testing/unit/` and pass `python -m unittest discover`.

## Development Workflow
```bash
# 1. Install frontend dependencies
npm install

# 2. Run local Next.js dev server
npm run dev

# 3. Execute unit test suite
./scripts/test.sh

# 4. Execute performance benchmarks
./scripts/benchmark.sh
```
