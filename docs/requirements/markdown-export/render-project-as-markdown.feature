Feature: Render a LikeC4 project as a Markdown page
  As a developer exploring a codebase I do not own
  I want to read its architecture — diagrams and all — directly in the repository on GitHub
  so that I can understand the design without checking it out or running a LikeC4 server

  Background:
    Given a LikeC4 project with views

  Scenario: One document per project
    When I render the project as Markdown
    Then I get a single Markdown document headed by the project title

  Scenario: Every authored view becomes a section
    When I render the project as Markdown
    Then each authored view appears as its own section directly under the project title
    And the section heading is the title of the view
    And the sections follow the authored order of the model

  Scenario: Automatically generated views without a source file are omitted
    Given the project has an automatically generated view that has no source file
    When I render the project as Markdown
    Then that generated view does not appear

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
