use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
};
use borsh::{BorshDeserialize, BorshSerialize};

mod instruction;
mod processor;
mod state;
mod error;
mod wormhole;

use instruction::CrossChainInstruction;

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = CrossChainInstruction::unpack(instruction_data)?;
    processor::process_instruction(program_id, accounts, instruction)
}
