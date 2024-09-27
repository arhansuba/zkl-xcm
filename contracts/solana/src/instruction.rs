use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::program_error::ProgramError;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum CrossChainInstruction {
    SendMessage {
        pub_key_1: String,
        pub_key_2: String,
        encrypted_data: String,
        target_chain: u16,
    },
    ReceiveMessage {
        vaa: Vec<u8>,
    },
    GetUserMessages {
        user: Pubkey,
    },
}

impl CrossChainInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&variant, rest) = input.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        Ok(match variant {
            0 => Self::SendMessage {
                pub_key_1: String::try_from_slice(rest)?,
                pub_key_2: String::try_from_slice(&rest[32..])?,
                encrypted_data: String::try_from_slice(&rest[64..])?,
                target_chain: u16::try_from_slice(&rest[96..])?,
            },
            1 => Self::ReceiveMessage {
                vaa: Vec::try_from_slice(rest)?,
            },
            2 => Self::GetUserMessages {
                user: Pubkey::try_from_slice(rest)?,
            },
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }
}