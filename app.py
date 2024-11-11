from flask import Flask, request, jsonify, send_from_directory, render_template, session, redirect, url_for
from pywhatkit import send_mail
from bson.json_util import dumps
from datetime import datetime, timedelta
from pymongo import MongoClient
import os

app = Flask(__name__)
app.secret_key = "hihihihih"
# MongoDB connection
app.config["MONGO_URI"] = "mongodb+srv://sourodip:rajghosh@first.ff1ia.mongodb.net/first?retryWrites=true&w=majority"
client = MongoClient(app.config["MONGO_URI"])

# Schemas: MongoDB collections
User = client.first.login
Record = client.first.recrds
Dash = client.first.dash
Event = client.first.events

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
    query = {"username": username}  # Only fetch reports for the authenticated user
    print(f"Query to fetch reports: {query}")  # Debugging: Print the query to see if it's correct

    try:
        reports_data = list(Dash.find(query))  # Fetch reports from the database
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
@app.route('/submitForm', methods=['POST', 'GET'])
def submit_form():
    data = request.get_json()

    # Create a new record dictionary
    new_record = {
        "date": data.get("date"),
        "totalSchoolsVisited": data.get("totalSchoolsVisited"),
        "interested": data.get("interested"),
        "pdDone": data.get("pdDone"),
        "username": session.get('username'),
        "pdFixed": data.get("pdFixed"),
        "tdDone": data.get("tdDone"),
        "tdFixed": data.get("tdFixed"),
        "smdDone": data.get("smdDone"),
        "smdFixed": data.get("smdFixed"),
        "signUpFollowUp": data.get("signUpFollowUp"),
        "signed": data.get("signed"),
        "totalSchoolsForSignUp": data.get("totalSchoolsForSignUp"),
        "strength": data.get("strength"),
        "district": data.get('district'),
        "submittedAt": datetime.utcnow()  # Add timestamp
    }

    try:
        # Insert the new record into MongoDB
        record.insert_one(new_record)
        return jsonify({"message": "Form submitted successfully!"}), 200
    except Exception as e:
        return jsonify({"message": f"Error saving form data: {str(e)}"}), 500


# Endpoint to fetch report data
@app.route('/fetch', methods=['GET'])
def fetch_reports():
    try:
        reports = list(Dash.find())
        return dumps(reports), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



    
# Get events by date
@app.route('/events', methods=['GET'])
def get_events():
    day = request.args.get('day')
    month = request.args.get('month')
    year = request.args.get('year')
    events = list(Event.find({"day": day, "month": month, "year": year}))
    return dumps(events), 200

@app.route('/events', methods=['POST'])
def add_event():
    try:
        event_data = request.get_json()
        Event.insert_one(event_data)
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
        send_mail(
            sender_email="ghoshraj368@gmail.com",
            password="",
            receiver_email=recipient_email,
            subject=subject,
            message=message
        )
        return jsonify(event_data), 201
    except Exception as e:
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

# Submit a new record
@app.route('/submit', methods=['POST'])
def submit_record():
    try:
        record_data = request.get_json()
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
    app.run(debug=True, port=port)

