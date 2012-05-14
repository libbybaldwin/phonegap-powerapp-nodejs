The server will create:
userid.db
connection.db
sharedid.db
**and user's workspaces in workspace/<usernames>


To Clean Everything and Start Fresh:
**Don't delete workspace/shared-items, just its contents
rm -rf workspace/shared-items/*
rm -rf workspace/<usernames>
rm userid.db
rm connection.db
rm sharedid.db
**To uninstall app on device:
adb uninstall com.mds.powerapp
