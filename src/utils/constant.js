const RequestType = {
  JOIN_REQUEST: "join_request",
  INVITE_REQUEST: "invite_request",
};

const RequestTypeEnum = Object.values(RequestType);

export { RequestType, RequestTypeEnum };

const RequestStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const RequestStatusEnum = Object.values(RequestStatus);

export { RequestStatus, RequestStatusEnum };

const HistoryActions = {
  GROUP_CREATED: "group_created",
  GROUP_DELETED: "group_deleted",
  MEMBER_ADDED: "member_added",
  MEMBER_REMOVED: "member_removed",
  MEMBER_LEFT: "member_left",
};

const HistoryActionsEnum = Object.values(HistoryActions);

export { HistoryActions, HistoryActionsEnum };

const UserRole = {
  ADMIN: "admin",
  USER: "user",
  GROUP_ADMIN: "group_admin",
  MEMBER: "member",
};

const UserRoleEnum = Object.values(UserRole);

export { UserRole, UserRoleEnum };
