# Forensic Case Organization Guide

This guide describes how to use the **Forensic Case Organizer** to sort and
rename evidence files. The tool helps ensure reliable and repeatable file
handling for investigative work.

## Goals

- **Reliable File Names**: Ensure each evidence item is uniquely identifiable.
- **Consistent Structure**: Organize cases into separate directories for easy
  retrieval.
- **AI-Assisted Categorization**: Apply basic heuristics or connect your own
  models for advanced classification.

## Usage

1. Run the organizer with the source and destination directories:

```bash
node scripts/forensic-organizer.js --source ./raw-evidence --dest ./cases
```

2. Review the output and verify files have been copied to case-specific folders
   with standardized names.

Use `--dry-run` to preview the operations without writing files.

## Advanced Techniques

- Integrate a classification model inside `forensic-organizer.js` to analyze
  file contents or metadata.
- Extend the script to log operations for chain-of-custody records.
- Combine with version control or cloud storage to maintain a secure audit
  trail.

This approach aligns with the broader architecture roadmap and demonstrates how
specialized tooling can fit into the Word GPT Plus ecosystem.
