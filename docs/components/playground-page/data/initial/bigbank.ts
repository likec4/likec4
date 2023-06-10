import type { FilesStore } from '../atoms'

export const BigBankPlayground = {
  current: 'file:///bigbank.c4' as const,
  files: {
    'file:///bigbank.c4': `
// The original C4 model
// https://structurizr.com/dsl?example=big-bank-plc

specification {

  element enterprise
  element softwaresystem
  element container
  element component

  element person {
    style {
      color secondary
      shape person
    }
  }

  element database {
    style {
      shape storage
    }
  }

}

model {

  customer = person "Personal Banking Customer" {
    description "A customer of the bank, with personal bank accounts."
  }

  bigbank = enterprise "Big Bank plc" {

    supportStaff = person "Customer Service Staff" {
      description: "Customer service staff within the bank."
    }

    backoffice = person "Back Office Staff" {
      description: "Administration and support staff within the bank."
    }

    mainframe = softwaresystem "Mainframe Banking System" {
      description: "Stores all of the core banking information about customers, accounts, transactions, etc."
      style {
        color: secondary
      }
    }

    email = softwaresystem "E-mail System" {
      description: "The internal Microsoft Exchange e-mail system."
      style {
        color: muted
      }
    }

    atm = softwaresystem "ATM" {
      description: "Allows customers to withdraw cash."
    }

    internetBankingSystem = softwaresystem "Internet Banking System" {
      description: "Allows customers to view information about their bank accounts, and make payments."

      singlePageApplication = container "Single-Page Application" {
        description: "Provides all of the Internet banking functionality to customers via their web browser."
        technology: "JavaScript and Angular"
        style {
          shape: browser
        }
      }
      mobileApp = container "Mobile App" {
        description: "Provides a limited subset of the Internet banking functionality to customers via their mobile device."
        technology: "Xamarin"
      }
      webApplication = container "Web Application" {
        description: "Delivers the static content and the Internet banking single page application."
        technology: "Java and Spring MVC"
      }
      apiApplication = container "API Application" {
        description: "Provides Internet banking functionality via a JSON/HTTPS API."
        technology: "Java and Spring MVC"

        signinController = component "Sign In Controller" {
          description: "Allows users to sign in to the Internet Banking System."
          technology: "Spring MVC Rest Controller"
        }

        accountsSummaryController = component "Accounts Summary Controller" {
          description: "Provides customers with a summary of their bank accounts."
          technology: "Spring MVC Rest Controller"
        }
        resetPasswordController = component "Reset Password Controller" {
          description: "Allows users to reset their passwords with a single use URL."
          technology: "Spring MVC Rest Controller"
        }
        securityComponent = component "Security Component" {
          description: "Provides functionality related to signing in, changing passwords, etc."
          technology: "Spring Bean"
        }
        mainframeBankingSystemFacade = component "Mainframe Banking System Facade" {
          description: "A facade onto the mainframe banking system."
          technology: "Spring Bean"
        }
        emailComponent = component "E-mail Component"{
          description:  "Sends e-mails to users."
          technology: "Spring Bean"
        }

      }
      database = database "Database" {
        description: "Stores user registration information, hashed authentication credentials, access logs, etc."
        technology: "Oracle Database Schema"
      }
    }
  }

  // relationships between people and software systems
  customer -> internetBankingSystem "Views account balances, and makes payments using"
  internetBankingSystem -> mainframe "Gets account information from, and makes payments using"
  internetBankingSystem -> email "Sends e-mail using"
  email -> customer "Sends e-mails to"
  customer -> supportStaff "Asks questions to"
  supportStaff -> mainframe "Uses"
  customer -> atm "Withdraws cash using"
  atm -> mainframe "Uses"
  backoffice -> mainframe "Uses"

  // relationships to/from containers
  customer -> webApplication "Visits bigbank.com using HTTPS"
  customer -> singlePageApplication "Views account balances, and makes payments using"
  customer -> mobileApp "Views account balances, and makes payments using"
  webApplication -> singlePageApplication "Delivers to the customer's web browser"

  // relationships to/from components
  singlePageApplication -> signinController "Makes API calls to"
  singlePageApplication -> accountsSummaryController "Makes API calls to"
  singlePageApplication -> resetPasswordController "Makes API calls to"
  mobileApp -> signinController "Makes API calls to"
  mobileApp -> accountsSummaryController "Makes API calls to"
  mobileApp -> resetPasswordController "Makes API calls to"
  signinController -> securityComponent "Uses"
  accountsSummaryController -> mainframeBankingSystemFacade "Uses"
  resetPasswordController -> securityComponent "Uses"
  resetPasswordController -> emailComponent "Uses"
  securityComponent -> database "Reads from and writes to"
  mainframeBankingSystemFacade -> mainframe "Makes API calls to"
  emailComponent -> email "Sends e-mail using"

}

views {

  view index {
    title "Big Bank - Landscape"

    include
      *,
      customer -> bigbank.*
  }

  view context of bigbank {
    title "Internet Banking System - SystemContext"
    include
      bigbank,
      mainframe,
      internetBankingSystem,
      email,
      customer

    style * {
      color secondary
    }
    style bigbank, internetBankingSystem {
      color primary
    }
  }

  view ibsContainers of internetBankingSystem {
    title "Internet Banking System - Containers"

    include
      *,
      -> customer
  }

  view customer of customer {
    include
      customer,
      bigbank,
      internetBankingSystem,
      customer -> internetBankingSystem.*,
      customer -> bigbank.*
    exclude webApplication
  }

  view spa of singlePageApplication {
    include
      *,
      apiApplication,
      internetBankingSystem,
      -> singlePageApplication ->

    style * {
      color muted
    }

    style singlePageApplication, customer {
      color primary
    }
  }

  view support of supportStaff {
    include
      *,
      bigbank,
      -> backoffice ->
  }

  view apiApp of internetBankingSystem.apiApplication {
    title "API Application - Components"

    include *

    style * {
      color muted
    }

    style singlePageApplication, mobileApp {
      color secondary
    }

    style apiApplication, apiApplication.* {
      color primary
    }
  }

  view webapp of webApplication {
    include
      *,
      internetBankingSystem,
      bigbank

    style bigbank {
      color muted
    }
  }

  view mobileApp of mobileApp {
    include
      *,
      internetBankingSystem,
      internetBankingSystem.apiApplication,
      mobileApp -> internetBankingSystem.apiApplication.*
  }

}
`.trimStart()
  }
} satisfies FilesStore
