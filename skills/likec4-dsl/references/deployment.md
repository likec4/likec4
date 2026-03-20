# Deployment — Detailed Reference

The deployment model maps logical architecture elements to physical infrastructure.

## Defining Deployment Node Kinds

Deployment node kinds are defined in the `specification` block:

```likec4
specification {
  deploymentNode environment {
    notation "Deployment Environment"
    style { color gray; opacity 0% }
  }
  deploymentNode region {
    notation "Geo Region"
  }
  deploymentNode zone {
    notation "Availability Zone"
  }
  deploymentNode vm {
    notation "Virtual Machine"
    style { opacity 5% }
  }
  deploymentNode container {
    notation "Container"
    style { icon tech:docker }
  }
}
```

Node kind properties: `notation`, `title`, `description`, `technology`, `summary`, `style { ... }`.

## Deployment Model

```likec4
deployment {
  // Top-level nodes
  node customerDevice {
    instanceOf customer
  }

  environment prod "Production" {
    title "Production Environment"
    technology "Kubernetes"
    description "Main production environment"

    region eu "EU" {
      zone zone1 {
        vm server1 "Web Server 1" {
          instanceOf cloud.ui
          instanceOf cloud.backend.api
        }
        vm server2 "Web Server 2" {
          instanceOf cloud.ui
          instanceOf cloud.backend.api
        }
        vm server3 "App Server" {
          instanceOf cloud.backend.service
          instanceOf cloud.backend.events
        }

        group amazon "Amazon" {
          instanceOf amazon.rds
        }
      }
    }

    region us "US" {
      vm usServer1 {
        instanceOf cloud.ui
        instanceOf cloud.backend.api
      }
      group amazon "Amazon" {
        instanceOf amazon.rds
        instanceOf amazon.sqs
      }
    }

    // Deployment-level relationships
    eu.zone1.amazon.rds -> us.amazon.rds "replicates" {
      style { color green }
    }
    us.amazon.rds -> eu.zone1.amazon.rds "replicates" {
      style { color green }
    }
  }
}
```

### Deployment Node Properties

Nodes support: `title`, `description`, `technology`, `summary`, `tags`, `icon`, `link`, `metadata`, `style { ... }`.

## Deployed Instances

Instances map logical model elements into deployment nodes:

```likec4
deployment {
  environment dev "Development" {
    // Anonymous instance (inherits name from model element)
    instanceOf cloud.frontend

    // Named instance
    devApi = instanceOf cloud.backend {
      title "Dev API Instance"
      technology "Docker"
      icon tech:docker
    }

    // Multiple instances of the same element
    vm web1 {
      instanceOf cloud.frontend      // Instance 1
    }
    vm web2 {
      instanceOf cloud.frontend      // Instance 2
    }
  }
}
```

Instance properties: `title`, `description`, `technology`, `summary`, `tags`, `icon`, `link`, `metadata`, `style { ... }`.

## Deployment Relationships

Relationships between deployed instances use FQN paths within the deployment model:

```likec4
deployment {
  environment prod {
    vm server1 { instanceOf cloud.backend }
    vm server2 { instanceOf cloud.backend }
    vm dbServer { instanceOf cloud.database }

    // Between instances in same environment
    server1.backend -> dbServer.database "reads/writes"
    server2.backend -> dbServer.database "reads/writes"

    // Between instances with styled relationship
    server1.backend -> server2.backend "replicates" {
      style { color red }
    }
  }
}
```

## Deployment Views

```likec4
views {
  deployment view production {
    title "Production Deployment"
    description "Infrastructure overview"

    // Include predicates — same syntax as element views
    include
      * -> prod,           // Everything connected to prod
      prod.**              // All descendants of prod

    // Exclude specific paths
    exclude
      us.usServer1.ui -> eu.*,
      server1.ui -> zone1.rds

    // Selective includes after exclude
    include
      eu.amazon.* <-> us.amazon.*,
      server3.backend -> eu.rds

    // Styling — uses deployment FQN paths
    style eu._ { color muted }
    style server1._, server4._ { color green }
    style us.amazon._, eu.amazon._ { color amber }

    autoLayout TopBottom
  }
}
```

### Deployment View Predicates

Same predicate syntax as element views, but referencing deployment FQN paths:

```likec4
include prod.**                          // All descendants of prod node
include * -> prod                        // Everything with relationship to prod
include eu.zone1.server1._ <-> us._     // Bidirectional between regions
exclude us.sqs                           // Exclude specific deployed instance
```

## Complete Example — Multi-Environment

```likec4
specification {
  deploymentNode environment { notation "Environment"; style { opacity 0% } }
  deploymentNode vm { notation "VM"; style { opacity 5% } }
}

deployment {
  environment dev "Development" {
    vm devmachine "Developer Machine" {
      technology "Ubuntu"
      instanceOf boutique.frontend
      instanceOf boutique.api
      instanceOf boutique.db
    }
  }

  environment prod "Production" {
    vm web1 "Web Server 1" {
      instanceOf boutique.frontend
      instanceOf boutique.api
    }
    vm web2 "Web Server 2" {
      instanceOf boutique.frontend
      instanceOf boutique.api
    }
    vm db1 "Database Primary" {
      instanceOf boutique.db
    }
    vm db2 "Database Replica" {
      instanceOf boutique.db
    }
    db1.db -> db2.db "replicates"
  }
}

views {
  deployment view dev-env {
    title "Development"
    include dev.**
  }

  deployment view prod-env {
    title "Production"
    include * -> prod, prod.**
    style web1._, web2._ { color green }
    style db1._, db2._ { color amber }
    autoLayout TopBottom
  }
}
```
