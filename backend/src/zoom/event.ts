export type ZoomSessions = {
	user_phone_callout_ringing: {
		account_id: string;
		object: {
			host_id: string;
			participant: {
				from_number: number;
				invitee_name: string;
				phone_number: number;
			};
			session_id: string;
			session_key: string;
			session_name: string;
			user_key: string;
			id?: number;
			uuid?: string;
		};
	};
	user_room_system_callout_ringing: {
		account_id: string;
		object: {
			host_id: string;
			inviter_name: string;
			message_id: string;
			participant: {
				call_type: string;
				device_ip: string;
			};
			session_id: string;
			session_name: string;
			id?: number;
			uuid?: string;
		};
	};
	recording_started: {
		account_id: string;
		object: {
			recording_file: {
				recording_end?: string;
				recording_start?: string;
			};
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
		};
	};
	recording_resumed: {
		account_id: string;
		object: {
			recording_file: {
				recording_end?: string;
				recording_start?: string;
			};
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
		};
	};
	live_streaming_stopped: {
		account_id: string;
		object: {
			id: string;
			live_streaming: {
				custom_live_streaming_settings: {
					page_url: string;
					stream_key: string;
					stream_url: string;
					resolution?: string;
				};
				date_time: string;
				service: string;
			};
			session_id: string;
			session_name: string;
			start_time: string;
			session_key?: string;
		};
	};
	stream_ingestion_stopped: {
		account_id: string;
		object: {
			session_id: string;
			session_name: string;
			stream_ingestion: {
				backup_stream_url: string;
				stream_id: string;
				stream_key: string;
				stream_name: string;
				stream_url: string;
				stream_description?: string;
			};
			session_key?: string;
		};
	};
	user_room_system_callout_rejected: {
		account_id: string;
		object: {
			host_id: string;
			inviter_name: string;
			message_id: string;
			participant: {
				call_type: string;
				device_ip: string;
			};
			session_id: string;
			session_name: string;
			id?: number;
			uuid?: string;
		};
	};
	alert: {
		account_id: string;
		object: {
			id: string;
			issues: string[];
			session_id: string;
			session_name: string;
			session_key?: string;
		};
	};
	recording_summary_completed: {
		account_id: string;
		object: {
			recording_files: {
				download_url?: string;
				file_extension?: string;
				file_name?: string;
				file_path?: string;
				file_size?: number;
				file_type?: string;
				id?: string;
				recording_end?: string;
				recording_start?: string;
				recording_type?: string;
				status?: string;
			}[];
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
		};
	};
	sharing_ended: {
		account_id: string;
		object: {
			id: string;
			session_id: string;
			session_name: string;
			user: {
				id: string;
				name: string;
				sharing_details: {
					content: string;
					date_time: string;
				};
				user_key?: string;
			};
			session_key?: string;
		};
	};
	recording_paused: {
		account_id: string;
		object: {
			recording_file: {
				recording_end?: string;
				recording_start?: string;
			};
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
		};
	};
	ended: {
		account_id: string;
		object: {
			end_time: string;
			id: string;
			session_id: string;
			session_name: string;
			start_time: string;
			session_key?: string;
		};
	};
	started: {
		account_id: string;
		object: {
			id: string;
			session_id: string;
			session_name: string;
			start_time: string;
			session_key?: string;
		};
	};
	stream_ingestion_unbind: {
		account_id: string;
		object: {
			session_id: string;
			session_name: string;
			stream_ingestion: {
				backup_stream_url: string;
				stream_id: string;
				stream_key: string;
				stream_name: string;
				stream_url: string;
				stream_description?: string;
			};
			session_key?: string;
		};
	};
	live_streaming_started: {
		account_id: string;
		object: {
			id: string;
			live_streaming: {
				custom_live_streaming_settings: {
					page_url: string;
					stream_key: string;
					stream_url: string;
					resolution?: string;
				};
				date_time: string;
				service: string;
			};
			session_id: string;
			session_name: string;
			start_time: string;
			session_key?: string;
		};
	};
	user_room_system_callout_missed: {
		account_id: string;
		object: {
			host_id: string;
			inviter_name: string;
			message_id: string;
			participant: {
				call_type: string;
				device_ip: string;
			};
			session_id: string;
			session_name: string;
			id?: number;
			uuid?: string;
		};
	};
	user_phone_callout_accepted: {
		account_id: string;
		object: {
			host_id: string;
			participant: {
				from_number: number;
				invitee_name: string;
				phone_number: number;
			};
			session_id: string;
			session_key: string;
			session_name: string;
			user_key: string;
			id?: number;
			uuid?: string;
		};
	};
	user_left: {
		account_id: string;
		object: {
			id: string;
			session_id: string;
			session_name: string;
			user: {
				id: string;
				leave_time: string;
				name: string;
				participant_uuid: string;
				leave_reason?: string;
				phone_number?: string;
				user_key?: string;
			};
			session_key?: string;
		};
	};
	sharing_started: {
		account_id: string;
		object: {
			id: string;
			session_id: string;
			session_name: string;
			user: {
				id: string;
				name: string;
				sharing_details: {
					content: string;
					date_time: string;
				};
				user_key?: string;
			};
			session_key?: string;
		};
	};
	user_phone_callout_canceled: {
		account_id: string;
		object: {
			participant: {
				from_number: number;
				invitee_name: string;
				phone_number: number;
			};
			session_id: string;
			session_key: string;
			session_name: string;
			user_key: string;
		};
	};
	recording_transcript_completed: {
		account_id: string;
		object: {
			recording_files: {
				download_url?: string;
				file_extension?: string;
				file_name?: string;
				file_path?: string;
				file_size?: number;
				file_type?: string;
				id?: string;
				recording_end?: string;
				recording_start?: string;
				recording_type?: string;
				status?: string;
			}[];
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
		};
	};
	recording_deleted: {
		account_id: string;
		object: {
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
		};
		operator: string;
		operator_id: string;
	};
	ai_interpreter_usage_summary: {
		account_id: string;
		object: {
			end_time: string;
			is_host: boolean;
			participant_uuid: string;
			session_id: string;
			session_name: string;
			start_time: string;
			usage: string;
			session_key?: string;
		};
	};
	user_room_system_callout_failed: {
		account_id: string;
		object: {
			host_id: string;
			inviter_name: string;
			message_id: string;
			participant: {
				call_type: string;
				device_ip: string;
			};
			reason_type: number;
			session_id: string;
			session_name: string;
			id?: number;
			uuid?: string;
		};
	};
	recording_completed: {
		account_id: string;
		object: {
			recording_files: {
				download_url?: string;
				external_storage_url?: string;
				file_extension?: string;
				file_name?: string;
				file_path?: string;
				file_size?: number;
				file_type?: string;
				id?: string;
				recording_end?: string;
				recording_start?: string;
				recording_type?: string;
				status?: string;
			}[];
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
			participant_audio_files?: {
				download_url?: string;
				file_extension?: string;
				file_name?: string;
				file_path?: string;
				file_size?: number;
				file_type?: string;
				id?: string;
				recording_end?: string;
				recording_start?: string;
				recording_type?: string;
				status?: string;
				user_id?: string;
				user_key?: string;
			}[];
			participant_video_files?: {
				download_url?: string;
				file_extension?: string;
				file_name?: string;
				file_path?: string;
				file_size?: number;
				file_type?: string;
				id?: string;
				recording_end?: string;
				recording_start?: string;
				recording_type?: string;
				status?: string;
				user_id?: string;
				user_key?: string;
			}[];
		};
	};
	recording_transcript_failed: {
		account_id: string;
		object: {
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
		};
	};
	recording_trashed: {
		account_id: string;
		object: {
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
		};
		operator: string;
		operator_id: string;
	};
	user_joined: {
		account_id: string;
		object: {
			id: string;
			session_id: string;
			session_name: string;
			user: {
				id: string;
				join_time: string;
				name: string;
				participant_uuid: string;
				phone_number?: string;
				user_key?: string;
			};
			session_key?: string;
		};
	};
	stream_ingestion_started: {
		account_id: string;
		object: {
			session_id: string;
			session_name: string;
			stream_ingestion: {
				backup_stream_url: string;
				stream_id: string;
				stream_key: string;
				stream_name: string;
				stream_url: string;
				stream_description?: string;
			};
			session_key?: string;
		};
	};
	stream_ingestion_connected: {
		account_id: string;
		object: {
			session_id: string;
			session_name: string;
			stream_ingestion: {
				backup_stream_url: string;
				stream_id: string;
				stream_key: string;
				stream_name: string;
				stream_url: string;
				stream_description?: string;
			};
			session_key?: string;
		};
	};
	stream_ingestion_disconnected: {
		account_id: string;
		object: {
			session_id: string;
			session_name: string;
			stream_ingestion: {
				backup_stream_url: string;
				stream_id: string;
				stream_key: string;
				stream_name: string;
				stream_url: string;
				stream_description?: string;
			};
			session_key?: string;
		};
	};
	recording_recovered: {
		account_id: string;
		object: {
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
		};
		operator: string;
		operator_id: string;
	};
	user_phone_callout_missed: {
		account_id: string;
		object: {
			host_id: string;
			participant: {
				from_number: number;
				invitee_name: string;
				phone_number: number;
			};
			session_id: string;
			session_key: string;
			session_name: string;
			user_key: string;
			id?: number;
			uuid?: string;
		};
	};
	user_phone_callout_rejected: {
		account_id: string;
		object: {
			host_id: string;
			participant: {
				from_number: number;
				invitee_name: string;
				phone_number: number;
			};
			session_id: string;
			session_key: string;
			session_name: string;
			user_key: string;
			id?: number;
			uuid?: string;
		};
	};
	user_room_system_callout_accepted: {
		account_id: string;
		object: {
			host_id: string;
			inviter_name: string;
			message_id: string;
			participant: {
				call_type: string;
				device_ip: string;
			};
			session_id: string;
			session_name: string;
			id?: number;
			uuid?: string;
		};
	};
	recording_stopped: {
		account_id: string;
		object: {
			recording_file: {
				recording_end?: string;
				recording_start?: string;
			};
			session_id: string;
			session_key: string;
			session_name: string;
			start_time: string;
			timezone: string;
		};
	};
};

export type ZoomSessionKeys = keyof ZoomSessions;
