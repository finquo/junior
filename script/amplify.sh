aws iam create-role \
  --role-name AmplifyConsoleServiceRole \
  --assume-role-policy-document file://amplify-policy.json

aws iam attach-role-policy \
  --role-name AmplifyConsoleServiceRole \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess-Amplify
