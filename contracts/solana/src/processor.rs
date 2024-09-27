use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
    program_error::ProgramError,
    sysvar::{rent::Rent, Sysvar},
};
use crate::{
    instruction::CrossChainInstruction,
    state::{Message, MessageAccount},
    error::CrossChainError,
    wormhole,
};

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction: CrossChainInstruction,
) -> ProgramResult {
    match instruction {
        CrossChainInstruction::SendMessage { pub_key_1, pub_key_2, encrypted_data, target_chain } => {
            send_message(accounts, pub_key_1, pub_key_2, encrypted_data, target_chain, program_id)
        },
        CrossChainInstruction::ReceiveMessage { vaa } => {
            receive_message(accounts, vaa, program_id)
        },
        CrossChainInstruction::GetUserMessages { user } => {
            get_user_messages(accounts, user)
        },
    }
}

fn send_message(
    accounts: &[AccountInfo],
    pub_key_1: String,
    pub_key_2: String,
    encrypted_data: String,
    target_chain: u16,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let sender_account = next_account_info(account_info_iter)?;
    let wormhole_config = next_account_info(account_info_iter)?;
    let message_account = next_account_info(account_info_iter)?;
    let wormhole_bridge = next_account_info(account_info_iter)?;
    let clock = next_account_info(account_info_iter)?;
    let rent = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !sender_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let payload = Message {
        is_initialized: true,
        sender: *sender_account.key,
        pub_key_1,
        pub_key_2,
        encrypted_data,
    };

    let mut message_account_data = MessageAccount::try_from_slice(&message_account.data.borrow())?;
    message_account_data.message = payload;
    message_account_data.serialize(&mut &mut message_account.data.borrow_mut()[..])?;

    wormhole::post_message(
        program_id,
        wormhole_config,
        wormhole_bridge,
        sender_account,
        message_account,
        clock,
        rent,
        system_program,
        0, // nonce
        message_account_data.try_to_vec()?,
        wormhole::ConsistencyLevel::Confirmed as u8,
    )?;

    msg!("Message sent to chain: {}", target_chain);
    Ok(())
}

fn receive_message(accounts: &[AccountInfo], vaa: Vec<u8>, program_id: &Pubkey) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let wormhole_config = next_account_info(account_info_iter)?;
    let posted_vaa = next_account_info(account_info_iter)?;
    let message_account = next_account_info(account_info_iter)?;
    let emitter_account = next_account_info(account_info_iter)?;
    let wormhole_bridge = next_account_info(account_info_iter)?;

    wormhole::verify_signature(
        program_id,
        wormhole_config,
        posted_vaa,
        emitter_account,
        wormhole_bridge,
        &vaa,
    )?;

    let parsed_vaa = wormhole::parse_vaa(&vaa)?;
    let message: Message = borsh::BorshDeserialize::try_from_slice(&parsed_vaa.payload)?;

    let mut message_account_data = MessageAccount::try_from_slice(&message_account.data.borrow())?;
    message_account_data.message = message;
    message_account_data.serialize(&mut &mut message_account.data.borrow_mut()[..])?;

    msg!("Message received and stored");
    Ok(())
}

fn get_user_messages(accounts: &[AccountInfo], user: Pubkey) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let message_account = next_account_info(account_info_iter)?;

    let message_account_data = MessageAccount::try_from_slice(&message_account.data.borrow())?;
    if message_account_data.message.sender != user {
        return Err(CrossChainError::InvalidUser.into());
    }

    msg!("User messages: {:?}", message_account_data.message);
    Ok(())
}
