// Commands module - exports all CRUD command modules

pub mod patients;
pub mod visits;
pub mod prescriptions;
pub mod medications;
pub mod reconciliation;
pub mod audit;

// Re-export all commands for easy access
pub use patients::*;
pub use visits::*;
pub use prescriptions::*;
pub use medications::*;
pub use reconciliation::*;
pub use audit::*;
