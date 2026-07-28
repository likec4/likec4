Feature: Export a workspace to browsable Markdown
  As a maintainer wiring architecture docs into a repository
  I want each project rendered as a README in its own folder
  so that browsing that folder on GitHub shows the architecture, diagrams and all

  Background:
    Given a LikeC4 workspace

  Scenario: Each project is rendered in its own folder by default
    Given the workspace contains more than one project
    When I export the workspace to Markdown
    Then each project gets a README page written into its own project folder

  Scenario: A project that renders to no views is skipped
    Given the workspace contains a project with no views
    When I export the workspace to Markdown
    Then no page is written for that project

  Scenario: Restricting the export to a single project
    Given the workspace contains more than one project
    When I export the workspace to Markdown for a single named project
    Then only that project gets a README page
    And the other projects are left out

  Scenario: An unknown project name is reported
    When I export the workspace to Markdown for a project that does not exist
    Then the export fails
    And it tells me the project was not found

  Scenario: Each page is the rendered architecture of its project
    When I export the workspace to Markdown
    Then each README is the Markdown rendering of its project, diagrams included
