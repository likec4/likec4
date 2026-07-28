Feature: Render a LikeC4 project as a Markdown page
  As a developer exploring a codebase I do not own
  I want to read its architecture — diagrams and all — directly in the repository on GitHub
  so that I can understand the design without checking it out or running a LikeC4 server

  Background:
    Given a LikeC4 project whose views are authored across multiple source files

  Scenario: One document per project
    When I render the project as Markdown
    Then I get a single Markdown document for the whole project

  Scenario: Every view becomes a section
    When I render the project as Markdown
    Then each view appears as its own section
    And the section heading is the title of the view

  Scenario: Views are grouped by their source file
    When I render the project as Markdown
    Then the views are grouped under a heading per source view file
    And the groups, and the views within each group, follow the authored order of the model

  Scenario: A section shows the diagram of the view
    When I render the project as Markdown
    Then each section embeds the diagram as a fenced Mermaid block that GitHub renders inline
    And that diagram is identical to what the Mermaid generator produces for the same view

  Scenario: A view with a description
    Given a view that has a description
    When I render the project as Markdown
    Then the description appears as prose above the diagram

  Scenario: A view without a description
    Given a view that has no description
    When I render the project as Markdown
    Then the section contains only the heading and the diagram

  Scenario: Output is reproducible
    When I render the same project twice
    Then the two Markdown documents are byte-for-byte identical
