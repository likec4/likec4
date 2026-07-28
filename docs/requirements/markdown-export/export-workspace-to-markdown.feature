Feature: Export a workspace to Markdown files
  As a maintainer wiring architecture docs into CI
  I want to export my LikeC4 workspace to Markdown files on disk
  so that the rendered architecture is committed in the repository for readers to browse

  Background:
    Given a LikeC4 workspace

  Scenario: Every project is exported by default
    Given the workspace contains more than one project
    When I export the workspace to Markdown
    Then one Markdown document is written for each project

  Scenario: Restricting the export to a single project
    Given the workspace contains more than one project
    When I export the workspace to Markdown for a single named project
    Then only that project is written
    And the other projects are left out

  Scenario: An unknown project name is reported
    When I export the workspace to Markdown for a project that does not exist
    Then the export fails
    And it tells me the project was not found

  Scenario: Default output location is the workspace
    When I export the workspace to Markdown without choosing an output location
    Then the documents are written under the workspace

  Scenario: A chosen output location is honored
    When I export the workspace to Markdown into a chosen output directory
    Then the documents are written under that directory

  Scenario: Each document is the rendered page for its project
    When I export the workspace to Markdown
    Then each document is the Markdown rendering of its project, diagrams included
