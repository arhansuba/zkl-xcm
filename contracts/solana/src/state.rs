use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Message {
    pub is_initialized: bool,
    pub sender: Pubkey,
    pub pub_key_1: String,
    pub pub_key_2: String,
    pub encrypted_data: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct MessageAccount {
    pub message: Message,
}

// File: src/error.rs
use thiserror::Error;
use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum CrossChainError {
    #[error("Invalid Instruction")]
    InvalidInstruction,
    #[error("Not Rent Exempt")]
    NotRentExempt,
    #[error("Expected Amount Mismatch")]
    ExpectedAmountMismatch,
    #[error("Amount Overflow")]
    AmountOverflow,
    #[error("Invalid User")]
    InvalidUser,
}

impl From<CrossChainError> for ProgramError {
    fn from(e: CrossChainError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
