from flask import Flask, request, jsonify, send_from_directory, render_template, session, redirect, url_for
from flask_bcrypt import Bcrypt
import yagmail
from bson.json_util import dumps, ObjectId
from datetime import datetime, timedelta,  timezone
from pymongo import MongoClient
from dotenv import load_dotenv

from flask import Flask, render_template, request, redirect, url_for, session
from datetime import timedelta

import os
load_dotenv()

myPASS = os.getenv('pass')
app = Flask(__name__)
app.secret_key = "hihihihih"

app.permanent_session_lifetime = timedelta(minutes=5)



# MongoDB connection
app.config["MONGO_URI"] = "mongodb+srv://sourodip:rajghosh@first.ff1ia.mongodb.net/first?retryWrites=true&w=majority"
client = MongoClient(app.config["MONGO_URI"])
bcrypt = Bcrypt()
# Schemas: MongoDB collections
User = client.first.login
Record = client.first.records
Dash = client.first.dash
Event = client.first.events
Admin = client.first.admin
Permit  = client.first.permissions

@app.route('/SubmitDistrictReport', methods=['POST', 'GET'])
def submit_district_report():
    # Get the JSON data from the request
    data = request.get_json()

    if "username" in session:
        data["user"] = session["username"]
    else:
        return jsonify({"status": "error", "message": "User not logged in"}), 401

    # Add date and time
    data["date"] = datetime.now().strftime("%Y-%m-%d")
    data["time"] = datetime.now().strftime("%H:%M:%S")

    try:
        # Insert the data into the Record collection
        Dash.insert_one(data)
        print("successfully inserted: ")
        print(data)

        # Send a success response
        return jsonify({"status": "success", "message": "Report submitted successfully"}), 200
    except Exception as e:
        # Handle exceptions and send an error response
        print(f"An error occurred: {e}")
        return jsonify({"status": "error", "message": "Failed to submit report"}), 500

@app.route('/getReport', methods=['GET'])
def get_report():
    if "username" in session:
        username = session["username"]
        
        # Query the database for records that match the user's username
        reports = Dash.find({"user": username})

        # Convert the reports to a list and replace ObjectId with string
        reports_data = []
        for report in reports:
            # Convert ObjectId to string in the report
            report['_id'] = str(report['_id'])
            reports_data.append(report)
        print(report)
        # Return the reports as JSON
        return jsonify({"status": "success", "data": reports_data}), 200
    else:
        return jsonify({"status": "error", "message": "User not logged in"}), 401


@app.route('/report_form', methods=['GET'])
def report_form():
    district = request.args.get('district')  # Get the district from the query string
    
    if not district:
        return jsonify({"status": "error", "message": "District not specified"}), 400
  
    return render_template("report_form.html", district=district)


@app.route('/getReportsByDistrict', methods=['GET'])
def get_reports_by_district():
    # Ensure the user is authenticated by checking session data
    username = session.get('username')  # Assuming the user_id is stored in the session
    print(f"User ID from session: {username}")  # Debugging: Check if the user is authenticated
    
    if not username:
        return jsonify({"status": "error", "message": "User not authenticated"}), 401

    # Fetch all reports for the current user
    query = {"user": username}  # Only fetch reports for the authenticated user
    print(f"Query to fetch reports: {query}")  # Debugging: Print the query to see if it's correct

    try:
        reports_data = list(Dash.find(query))  # Fetch reports from the database
        print(reports_data)
    except Exception as e:
        print(f"Error while fetching reports: {str(e)}")  # Log any database fetching errors
        return jsonify({"status": "error", "message": "Error fetching reports from the database"}), 500

    if not reports_data:
        print("No reports found for the user.")  # Debugging: If no reports are found
        return jsonify({"status": "error", "message": "No reports found for this user"}), 404

    # Classify reports by district
    reports_by_district = {}
    
    for report in reports_data:
        district = report.get('district', 'Unknown')  # Get district from report, default to 'Unknown' if not present
        if district not in reports_by_district:
            reports_by_district[district] = []
        reports_by_district[district].append(report)

    # Convert ObjectId to string for JSON serialization
    for district, reports in reports_by_district.items():
        for report in reports:
            report["_id"] = str(report["_id"])

    # Return the classified reports
    print("Reports classified by district:", reports_by_district)  # Debugging: Check the classified reports
    return jsonify({"status": "success", "data": reports_by_district}), 200

@app.route('/individual_records')
def individual_records():
    if 'username' in session:
        username = session['username']
        
        return render_template('individual.html')
    else:
        return redirect(url_for('login'))

@app.route('/get_permissions', methods=['GET'])
def get_permissions():
    try:
        # Fetch all permission requests from the 'permissions' collection
        # We are fetching only 'pending' requests, but you can modify this as needed
        permissions = Permit.find({'status': 'pending'})
        
        # Create a list to hold the permission data
        permissions_list = []
        
        # Iterate over each permission request and format the response
        for permission in permissions:
            permissions_list.append({
                'username': permission['username'],
                'request_date': permission['request_date'],
                'status': permission['status']
            })
        
        # Return the list of permission requests as a JSON response
        print(permissions_list)
        return jsonify(permissions_list)
    
    except Exception as e:
        return jsonify({'message': 'Error fetching permissions', 'error': str(e)}), 500


@app.route('/send_permission_request', methods=['POST', 'GET'])
def send_permission_request():
    try:
        # Get the username from the incoming JSON request body
        data = request.json
        username = session.get("user")
        # Check if username is provided
        if not username:
            return jsonify({'message': 'Username is required'}), 400

        # Check if the user already has a request in the permissions collection
        existing_request = Permit.find_one({'username': username})

        # If the user has a granted request, return an error
        if existing_request and existing_request.get('status') == 'granted':
            return jsonify({'message': 'Permission already granted for this user'}), 400

        # Create a new permission request document in the MongoDB database
        if not existing_request or existing_request.get('status') == 'rejected':
            now_utc = datetime.now(timezone.utc)
            # Convert UTC to IST (UTC + 5:30)
            ist_offset = timedelta(hours=5, minutes=30)
            now_ist = now_utc + ist_offset
            permission_request = {
                'username': username,
                'status': 'pending',  # Pending status initially
                'request_date': now_ist.isoformat()  # Use timezone-aware datetime
            }
            print(permission_request)
            Permit.insert_one(permission_request)
            return jsonify({'message': 'Permission request sent successfully', 'success': True}), 200

        # Return success response
        return jsonify({'message': 'Permission request already exists for this user'}), 400

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error sending permission request', 'error': str(e)}), 500

@app.route('/check_permission', methods=['POST', 'GET'])
def check_permission():
    try:
        print("Received POST request for /check_permission")  # Debug print
        username = session.get("user")
        if not username:
            return jsonify({'message': 'Username is required'}), 400
        
        permission = Permit.find_one({'username': username})

        if permission:
            if permission['status'] == 'granted':
                return jsonify({'hasAccess': True}), 200
            else:
                return jsonify({'hasAccess': False}), 200
        else:
            return jsonify({'hasAccess': False}), 200

    except Exception as e:
        print(f"Error: {str(e)}")  # Debug error message
        return jsonify({'message': 'Error checking permission', 'error': str(e)}), 500

@app.route('/update_permission', methods=['POST'])
def update_permission():
    try:
        # Get data from the POST request
        username = request.json.get('username')
        status = request.json.get('status')  # Expected values: 'granted' or 'rejected'
        
        # Validate the input
        if status not in ['granted']:
            return jsonify({'message': 'Invalid status. Use "granted" or "rejected".'}), 400
        
        # Update the permission status in the 'permissions' collection
        result = Permit.update_one(
            {'username': username, 'status': 'pending'},  # Find pending request by username
            {'$set': {'status': status}}  # Set the new status
        )
        
        if result.modified_count > 0:
            return jsonify({'message': f'Permission {status} successfully!'}), 200
        else:
            return jsonify({'message': 'Permission request not found or already updated.'}), 404
    
    except Exception as e:
        # Handle unexpected errors
        return jsonify({'message': 'Error updating permission', 'error': str(e)}), 500


@app.route('/signup', methods=['POST'])
def signup():
    # Get the data from the POST request
    username = request.json.get('username')
    password = request.json.get('password')

    # Check if the username already exists in the 'admin' collection
    if Admin.find_one({'username': username}):
        return jsonify({'message': 'Username already exists'}), 400

    # Hash the password before storing it
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Store the new admin's credentials in the 'admin' collection
    Admin.insert_one({
        'username': username,
        'password': hashed_password
    })

    return jsonify({'message': 'Signup successful!'}), 201

@app.route('/signin', methods=['POST'])
def signin():
    # Get the data from the POST request
    username = request.json.get('username')
    password = request.json.get('password')

    # Find the admin by username in the 'admin' collection
    admin = Admin.find_one({'username': username})

    if admin and bcrypt.check_password_hash(admin['password'], password):
        return jsonify({'message': 'Login successful!'}), 200
    else:
        return jsonify({'message': 'Invalid username or password'}), 401

@app.route('/admin')
def admin():
    return render_template("admin.html")
@app.route('/getWeeklyReport', methods=['GET'])
def get_weekly_report():
    # Get the current date and time
    now = datetime.now()
    
    # Calculate the date for one week ago
    one_week_ago = now - timedelta(days=7)

    # Query MongoDB to find records created within the last week
    reports = Dash.find({"date": {"$gte": one_week_ago.strftime('%Y-%m-%d')}})

    # Prepare the response data
    reports_data = []
    for report in reports:
        report_data = {
            "_id": str(report["_id"]),
            "date": report["date"],
            "totalSchoolsVisited": report["totalSchoolsVisited"],
            "weekSelect": report["weekSelect"], 
            "interested": report["interested"],
            "pdDone": report["pdDone"],
            "pdFixed": report["pdFixed"],
            "tdDone": report["tdDone"],
            "tdFixed": report["tdFixed"],
            "smdDone": report["smdDone"],
            "smdFixed": report["smdFixed"],
            "signUpFollowUp": report["signUpFollowUp"],
            "signed": report["signed"],
            "totalSchoolsForSignUp": report["totalSchoolsForSignUp"],
            "strength": report["strength"],
            "user": report["user"],
            "time": report["time"]
        }
        reports_data.append(report_data)

    return jsonify({"status": "success", "data": reports_data}), 200

# <p><strong>Week no.:</strong> ${report.weekSelect}</p>   in weekly.html
# @app.route('/getWeeklyReport', methods=['GET'])
# def get_weekly_report():
#     # Get the current date and time
#     now = datetime.now()

#     # Calculate the date for one week ago
#     one_week_ago = now - timedelta(days=7)

#     # Query MongoDB to find records created within the last week
#     reports = Dash.find({"date": {"$gte": one_week_ago.strftime('%Y-%m-%d')}})

#     # Prepare the response data
#     reports_data = []
#     for report in reports:
#         report_data = {
#             "_id": str(report["_id"]),
#             "date": report["date"],
#             "totalSchoolsVisited": report.get("totalSchoolsVisited", None),
#             "weekSelect": report.get("weekSelect", None),  # Corrected line
#             "interested": report.get("interested", None),
#             "pdDone": report.get("pdDone", None),
#             "pdFixed": report.get("pdFixed", None),
#             "tdDone": report.get("tdDone", None),
#             "tdFixed": report.get("tdFixed", None),
#             "smdDone": report.get("smdDone", None),
#             "smdFixed": report.get("smdFixed", None),
#             "signUpFollowUp": report.get("signUpFollowUp", None),
#             "signed": report.get("signed", None),
#             "totalSchoolsForSignUp": report.get("totalSchoolsForSignUp", None),
#             "strength": report.get("strength", None),
#             "user": report.get("user", None),
#             "time": report.get("time", None)
#         }
#         reports_data.append(report_data)

#     return jsonify(reports_data)


@app.route('/')
def index():
    return render_template("index.html")
@app.route('/show')
def show():
    return render_template("show.html")
@app.route('/record')
def record():
    return render_template("record.html")
@app.route('/weekly_records')
def wr():
    return render_template('weekly.html')
@app.route('/calendar')
def calendar():
    return render_template("calendar.html")
@app.route('/dashboard')
def dashboard():
    return render_template("dashboard.html")
@app.route('/district_records')
def dr():
    return render_template("district.html")





# Route to handle form submission

@app.route('/submitForm', methods=['POST'])
def submit_form():
    form_data = request.json
    print(form_data)
    # Convert string dates to datetime objects
    form_data['demoGivenDate'] = datetime.strptime(form_data['demoGivenDate'], '%Y-%m-%d')
    form_data['followUpDate'] = datetime.strptime(form_data['followUpDate'], '%Y-%m-%d')
    form_data['signedAt'] = datetime.now()

    # Insert the record into the collection
    result = Record.insert_one(form_data)
    print(form_data)
    return jsonify({'message': 'Form submitted successfully', 'id': str(result.inserted_id)}), 201


# Endpoint to fetch report data

@app.route('/fetch', methods=['GET'])
def fetch_user_records():
    try:
        # Get the username from the query parameters or headers (depending on your approach)
        username = session.get('user')  # Assuming the username is passed as a query parameter
        
        if not username:
            return jsonify({'message': 'Username is required'}), 400

        # Query the database for records for the specific user
        user_records = list(Record.find({'user': username}))

        # If no records are found, return a message
        if not user_records:
            return jsonify({'message': 'No records found for this user'}), 404

        # Format the records as a list of dictionaries
        records_list = []
        for record in user_records:
            # Optionally, remove the MongoDB-specific `_id` field
            record['_id'] = str(record['_id'])  # Convert ObjectId to string if needed
            records_list.append(record)

        return jsonify(records_list), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error fetching user records', 'error': str(e)}), 500


    
# Get events by date
@app.route('/events', methods=['GET'])
def get_events():
    day = request.args.get('day')
    month = request.args.get('month')
    year = request.args.get('year')
    events = list(Event.find({"day": day, "month": month, "year": year}))
    return dumps(events), 200
def convert_objectid_to_str(document):
    if isinstance(document, dict):
        return {k: convert_objectid_to_str(v) for k, v in document.items()}
    elif isinstance(document, list):
        return [convert_objectid_to_str(i) for i in document]
    elif isinstance(document, ObjectId):
        return str(document)
    else:
        return document

@app.route('/events', methods=['POST'])
def add_event():
    try:
        event_data = request.get_json()
        
        # Insert the event into MongoDB
        Event.insert_one(event_data)
        
        # Extract necessary fields from the event data
        day = event_data.get("day")
        month = event_data.get("month")
        year = event_data.get("year")
        title = event_data.get("title")
        description = event_data.get("description")
        recipient_email = event_data.get("recipient_email")

        message = (f"Hello,\n\nYour event '{title}' has been successfully registered!\n\n"
                   f"Event Details:\n"
                   f"Date: {day}/{month}/{year}\n"
                   f"Title: {title}\n"
                   f"Description: {description}\n\n"
                   "Thank you for using our service!")
        
        # Customize subject and content of the email
        subject = "Event Registration Confirmation"
        print(message)
        
        # Send email using yagmail
        yag = yagmail.SMTP('ghoshraj368@gmail.com', myPASS)
        yag.send(
            to=recipient_email,
            subject=subject,
            contents=message
        )
        
        # Convert the inserted event data to ensure ObjectId is serialized
        # Retrieve the event data from MongoDB
        inserted_event = Event.find_one({"title": title, "description": description})
        
        # Convert ObjectId fields to string
        inserted_event = convert_objectid_to_str(inserted_event)
        
        # Return the event data with a 201 response
        return jsonify(inserted_event), 201
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/events', methods=['DELETE'])
def delete_event():
    try:
        event_data = request.get_json()
        Event.delete_one({
            "day": event_data['day'],
            "month": event_data['month'],
            "year": event_data['year'],
            "title": event_data['title']
        })
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User login or registration
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']
    session["username"]  = username
    
    print("session username set to: ", username)
    print(password)

    user = User.find_one({"username": username})
    
    if user:
        if user['password'] == password:
            session['user'] =  username
            return jsonify({'success': True, 'message': 'Login successful'}), 200
        else:
            return jsonify({'success': False, 'message': 'Incorrect password'}), 401
    else:
        User.insert_one({"username": username, "password": password})
        return jsonify({'success': True, 'message': 'User registered and logged in'}), 201



@app.route('/tracker')
def tracker():
    if 'user' in session:
        return render_template('tracker.html')
    return redirect(url_for('index'))

@app.route('/update_location', methods=['POST'])
def update_location():
    if 'user' in session:
        latitude = request.form['latitude']
        longitude = request.form['longitude']
        # Here you can save the coordinates to a database or perform other operations
        return f"Location updated to {latitude}, {longitude}"
    return "User not logged in", 403
# Submit a new record
@app.route('/submit', methods=['POST', 'GET'])
def submit_record():
    try:
        record_data = request.get_json()
        record_data["user"]   = session.get("user")
        Record.insert_one(record_data)
        return jsonify({'message': 'Record submitted successfully!'}), 200
    except Exception as e:
        return jsonify({'message': 'Error submitting record.', 'error': str(e)}), 500

# Fetch records data
@app.route('/fetch_records', methods=['GET'])
def fetch_records():
    try:
        records = list(Record.find())
        return dumps(records), 200
    except Exception as e:
        return jsonify({'message': 'Error fetching data.', 'error': str(e)}), 500

# Serve HTML files for specific routes
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('public', filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(debug=True, port=5000)


if __name__ == '__main__':
    app.run(debug=True)
